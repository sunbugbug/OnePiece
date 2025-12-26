import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Phase } from './Phase';

@Entity('user_submissions')
export class UserSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  phaseId!: string;

  @ManyToOne(() => Phase, (phase) => phase.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase!: Phase;

  @Column('decimal', { precision: 10, scale: 8 })
  submittedLat!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  submittedLng!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  distance!: number; // 실제 위치와의 거리 (미터 단위)

  @Column({ default: false })
  isCorrect!: boolean;

  @CreateDateColumn()
  submittedAt!: Date;
}


