import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Phase } from './Phase';

export enum HintType {
  POEM = 'poem',
  RIDDLE = 'riddle',
  DIRECTION = 'direction',
  ENVIRONMENTAL = 'environmental',
  NEGATIVE = 'negative',
}

@Entity('hint_versions')
export class HintVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  phaseId!: string;

  @ManyToOne(() => Phase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phaseId' })
  phase?: Phase;

  @Column({
    type: 'simple-enum',
    enum: HintType,
  })
  hintType!: HintType;

  @Column('text')
  hintText!: string;

  @Column()
  version!: string; // 프롬프트 버전 (예: "1.0", "2.1")

  @Column({ nullable: true })
  promptUsed?: string; // 사용된 프롬프트 (디버깅용)

  @CreateDateColumn()
  createdAt!: Date;
}


