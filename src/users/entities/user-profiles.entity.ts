import { Language } from '@/core/parameters/entities/languages.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

export enum gender_type {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true, nullable: false, name: 'auth_user_id' })
  authUserId!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastname!: string;

  @Column({
    type: 'text',
    array: true,
    nullable: false,
    default: () => "'{USER}'",
    comment: 'List of roles assigned to the user. Valid values: ADMIN | USER',
  })
  roles!: string[];

  @ManyToOne(() => Language, { nullable: true })
  @JoinColumn({ name: 'language' })
  language!: Language | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'date', nullable: true, name: 'birth_date' })
  birthDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  gender!: gender_type | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
