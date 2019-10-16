import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('provider_metrics')
@Unique(['providerName', 'operator', 'country', 'windowStart'])
export class ProviderMetricEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  providerName!: string;

  @Column()
  operator!: string;

  @Column()
  country!: string;

  @Column({ type: 'timestamptz' })
  windowStart!: Date;

  @Column({ type: 'int', default: 0 })
  successCount!: number;

  @Column({ type: 'int', default: 0 })
  failureCount!: number;

  @Column({ type: 'bigint', default: 0 })
  totalLatencyMs!: number;

  @Column({ type: 'int', default: 0 })
  sampleCount!: number;

  @Column({ type: 'float', default: 0.5 })
  score!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
