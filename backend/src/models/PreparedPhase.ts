import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Phase } from './Phase';
import { User } from './User';

@Entity('prepared_phases')
export class PreparedPhase {
  @PrimaryColumn({ type: 'uuid' })
  phaseId!: string;

  @OneToOne(() => Phase, (phase) => phase.preparedPhase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase!: Phase;

  @Column({ type: 'uuid' })
  approvedBy!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  @CreateDateColumn()
  approvedAt!: Date;
}


