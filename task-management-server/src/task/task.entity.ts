import { User } from '../users/users.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';


export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}



@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.TODO,
    })
    status: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;

    @Column({ type: 'timestamp', nullable: true })
    dueDate: Date;

    // User who CREATED the task
    @ManyToOne(() => User, (user) => user.createdTasks, { eager: true })
    createdBy: User;

    // User who is ASSIGNED the task
    @ManyToOne(() => User, (user) => user.assignedTasks, { eager: true })
    assignedTo: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
