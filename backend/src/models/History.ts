import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Phase } from './Phase';
import { User } from './User';

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  phaseId!: string;

  @ManyToOne(() => Phase, (phase) => phase.histories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase!: Phase;

  @Column({ type: 'uuid' })
  winnerId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winnerId' })
  winner?: User;

  @Column()
  winnerName!: string;

  @Column('decimal', { precision: 10, scale: 8 })
  submittedLat!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  submittedLng!: number;

  @CreateDateColumn()
  solvedAt!: Date;
}


