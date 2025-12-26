import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserAuthProvider } from './UserAuthProvider';
import { UserSubmission } from './UserSubmission';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  nickname!: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => UserAuthProvider, (authProvider) => authProvider.user)
  authProviders!: UserAuthProvider[];

  @OneToMany(() => UserSubmission, (submission) => submission.user)
  submissions!: UserSubmission[];
}


