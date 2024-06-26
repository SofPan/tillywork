import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    UseGuards,
    Request,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { Project } from "./project.entity";
import { CreateProjectDto } from "./dto/create.project.dto";
import { UpdateProjectDto } from "./dto/update.project.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.auth.guard";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiBearerAuth()
@ApiTags("projects")
@UseGuards(JwtAuthGuard)
@Controller({
    path: "projects",
    version: "1",
})
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Get()
    findAll(@Request() req): Promise<Project[]> {
        const { user } = req;
        return this.projectsService.findAll({
            where: {
                users: {
                    user,
                },
            },
        });
    }

    @Get(":id")
    findOne(@Param("id") id: string): Promise<Project> {
        return this.projectsService.findOne(+id);
    }

    @Post()
    create(
        @Body() createProjectDto: CreateProjectDto,
        @Request() req
    ): Promise<Project> {
        return this.projectsService.create({
            ...createProjectDto,
            ownerId: req.user.id,
            users: [
                {
                    user: req.user,
                    role: "owner",
                    project: createProjectDto as Project,
                },
            ],
        });
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() updateProjectDto: UpdateProjectDto
    ): Promise<Project> {
        return this.projectsService.update(+id, updateProjectDto);
    }

    @Delete(":id")
    remove(@Param("id") id: string): Promise<void> {
        return this.projectsService.remove(+id);
    }
}
