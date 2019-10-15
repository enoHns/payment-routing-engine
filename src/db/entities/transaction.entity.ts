import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AttemptEntity } from './attempt.entity';
import { AuditLogEntity } from './auditLog.entity';

export enum TxStatus {
  INITIATED = 'INITIATED',
  OPERATOR_DETECTED = 'OPERATOR_DETECTED',
  PROVIDER_SELECTED = 'PROVIDER_SELECTED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  idempotencyKey!: string;

  @Column()
  @Index()
  phone!: string;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column()
  country!: string;

  @Column({ nullable: true })
  operator?: string;

  @Column({
    type: 'enum',
    enum: TxStatus,
    default: TxStatus.INITIATED,
  })
  @Index()
  status!: TxStatus;

  @Column({ nullable: true })
  clientCallbackUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => AttemptEntity, attempt => attempt.transaction)
  attempts!: AttemptEntity[];

  @OneToMany(() => AuditLogEntity, log => log.transaction)
  auditLogs!: AuditLogEntity[];

  @CreateDateColumn()
  @Index()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt?: Date;
}
