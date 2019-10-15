import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionEntity } from './transaction.entity';

export enum AttemptStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

@Entity('attempts')
export class AttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  transactionId!: string;

  @ManyToOne(() => TransactionEntity, tx => tx.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: TransactionEntity;

  @Column()
  @Index()
  providerName!: string;

  @Column({ nullable: true })
  providerTxId?: string;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.PENDING,
  })
  status!: AttemptStatus;

  @Column({ type: 'float' })
  score!: number;

  @Column({ type: 'int', nullable: true })
  latencyMs?: number;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  webhookPayload?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;
}
