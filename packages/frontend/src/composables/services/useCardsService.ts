import { useHttp } from '@/composables/useHttp';
import type {
  Card,
  CardList,
  CreateCardDto,
} from '@/components/project-management/cards/types';
import type {
  QueryFilter,
  TableSortOption,
} from '@/components/project-management/views/TableView/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';

export interface CardsData {
  cards: Card[];
  total: number;
}

export interface GetCardsParams {
  listId: number;
  page: number;
  limit: number;
  sortBy?: TableSortOption[];
  filters?: QueryFilter;
}

export interface GetGroupCardsInfiniteQueryParams {
  listId: number;
  groupId: number;
  initialCards?: CardsData;
  filters?: QueryFilter;
  sortBy?: Ref<TableSortOption[] | undefined>;
}

export const useCardsService = () => {
  const queryClient = useQueryClient();
  const { sendRequest } = useHttp();

  async function getCards({
    listId,
    page = 1,
    limit = 10,
    sortBy = [
      {
        key: 'cardLists.order',
        order: 'asc',
      },
    ],
    filters,
  }: GetCardsParams): Promise<CardsData> {
    return sendRequest('/cards/search', {
      method: 'POST',
      data: {
        listId,
        page,
        limit,
        sortBy: sortBy[0]?.key,
        sortOrder: sortBy[0]?.order,
        filters,
      },
    });
  }

  async function createCard(card: CreateCardDto): Promise<Card> {
    return sendRequest('/cards', {
      method: 'POST',
      data: card,
    });
  }

  async function getCard(cardId: number): Promise<Card> {
    return sendRequest(`/cards/${cardId}`, {
      method: 'GET',
    });
  }

  async function updateCard(card: Card): Promise<Card> {
    return sendRequest(`/cards/${card.id}`, {
      method: 'PUT',
      data: card,
    });
  }

  async function deleteCard(cardId: number): Promise<void> {
    return sendRequest(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async function updateCardListStage({
    cardId,
    cardListId,
    listStageId,
  }: {
    cardId: number;
    cardListId: number;
    listStageId: number;
  }) {
    return sendRequest(`/cards/${cardId}/lists/${cardListId}`, {
      method: 'PUT',
      data: {
        listStageId,
      },
    });
  }

  function useGetGroupCardsInfinite({
    listId,
    groupId,
    initialCards,
    filters,
    sortBy,
  }: GetGroupCardsInfiniteQueryParams) {
    return useInfiniteQuery({
      queryFn: ({ pageParam = 1 }) =>
        getCards({
          listId: listId,
          page: pageParam,
          limit: 15,
          filters,
          sortBy: sortBy?.value,
        }),
      queryKey: ['cards', { groupId }],
      getNextPageParam: (lastPage, allPages, lastPageParam) => {
        if (lastPage?.cards.length === 0) {
          return undefined;
        }

        return lastPageParam + 1;
      },
      initialPageParam: 1,
      initialData: () =>
        initialCards
          ? {
              pages: [initialCards],
              pageParams: [1],
            }
          : undefined,
      staleTime: 1 * 60 * 1000,
    });
  }

  function useCreateCardMutation() {
    return useMutation({
      mutationFn: createCard,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  function useGetCardQuery(cardId: number) {
    return useQuery({
      queryKey: ['cards', cardId],
      queryFn: () => getCard(cardId),
    });
  }

  function useUpdateCardMutation() {
    return useMutation({
      mutationFn: updateCard,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  function useDeleteCardMutation() {
    return useMutation({
      mutationFn: deleteCard,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  function useUpdateCardListStageMutation() {
    return useMutation({
      mutationFn: updateCardListStage,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      },
    });
  }

  async function updateCardList({
    cardId,
    cardListId,
    updateCardListDto,
  }: {
    cardId: number;
    cardListId: number;
    updateCardListDto: Partial<CardList>;
  }) {
    return sendRequest(`/cards/${cardId}/lists/${cardListId}`, {
      method: 'PUT',
      data: updateCardListDto,
    });
  }

  function useUpdateCardListMutation() {
    return useMutation({
      mutationFn: updateCardList,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
    });
  }

  return {
    updateCardListStage,
    useGetGroupCardsInfinite,
    useUpdateCardListStageMutation,
    useCreateCardMutation,
    useUpdateCardMutation,
    useGetCardQuery,
    useDeleteCardMutation,
    useUpdateCardListMutation,
  };
};
