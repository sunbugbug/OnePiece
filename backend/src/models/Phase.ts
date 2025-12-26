import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PreparedPhase } from './PreparedPhase';
import { UserSubmission } from './UserSubmission';
import { History } from './History';

export enum PhaseStatus {
  ACTIVE = 'active',
  SOLVED = 'solved',
  PREPARED = 'prepared',
}

@Entity('phases')
export class Phase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 8 })
  lat!: number;

  @Column('decimal', { precision: 11, scale: 8 })
  lng!: number;

  @Column({ nullable: true })
  streetViewId?: string;

  @Column('text')
  hintText!: string;

  @Column({
    type: 'simple-enum',
    enum: PhaseStatus,
    default: PhaseStatus.PREPARED,
  })
  status!: PhaseStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  solvedAt?: Date;

  // Relations
  @OneToOne(() => PreparedPhase, (preparedPhase) => preparedPhase.phase)
  preparedPhase?: PreparedPhase;

  @OneToMany(() => UserSubmission, (submission) => submission.phase)
  submissions!: UserSubmission[];

  @OneToMany(() => History, (history) => history.phase)
  histories!: History[];
}


