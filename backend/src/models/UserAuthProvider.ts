import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum ProviderType {
  EMAIL_PASSWORD = 'email_password',
  GOOGLE = 'google',
  GITHUB = 'github',
  KAKAO = 'kakao',
}

@Entity('user_auth_providers')
export class UserAuthProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.authProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'simple-enum',
    enum: ProviderType,
  })
  providerType!: ProviderType;

  @Column()
  providerId!: string; // 해당 제공자의 사용자 ID

  @Column({ nullable: true })
  providerEmail?: string; // 해당 제공자의 이메일

  @CreateDateColumn()
  connectedAt!: Date;

  @Column({ nullable: true })
  lastUsedAt?: Date;
}


