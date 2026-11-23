/**
 * VivoQuest Database Schema & Index Definitions
 * Exactly 69 collections matching Section 4 of VivoQuest Backend Implementation Plan
 * Uses strict $jsonSchema validators and standardized index naming:
 * ix_<collection>_<fields> and ux_<collection>_<fields>
 */

export interface IndexDefinition {
  name: string;
  key: Record<string, number | string>;
  unique?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, any>;
}

export interface CollectionDefinition {
  name: string;
  module: string;
  description: string;
  validator: {
    $jsonSchema: {
      bsonType: 'object';
      required: string[];
      properties: Record<string, any>;
      additionalProperties?: boolean;
    };
  };
  indexes: IndexDefinition[];
}

const baseProperties = {
  _id: { bsonType: 'objectId' },
  schemaVersion: { bsonType: 'int', minimum: 1 },
  createdAt: { bsonType: 'date' },
  updatedAt: { bsonType: 'date' },
  createdBy: { bsonType: ['string', 'objectId', 'null'] },
  deletedAt: { bsonType: ['date', 'null'] },
};

export const COLLECTIONS: Record<string, CollectionDefinition> = {
  // ==========================================
  // 1. IAM (Identity & Access) - 8 collections
  // ==========================================
  iam_users: {
    name: 'iam_users',
    module: 'iam',
    description: 'User master accounts, phone hash, role list and MFA status',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['phoneHash', 'roles', 'city', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          phoneE164: { bsonType: ['string', 'null'] }, // encrypted or masked
          phoneHash: { bsonType: 'string', description: 'HMAC-SHA256 of normalized phone' },
          roles: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          currentRole: { bsonType: ['string', 'null'] },
          city: { bsonType: 'string' },
          preferredLanguage: { bsonType: ['string', 'null'], enum: ['en', 'mr', null] },
          status: { bsonType: 'string', enum: ['active', 'suspended', 'pending_verification', 'locked'] },
          lastLoginAt: { bsonType: ['date', 'null'] },
          mfa: {
            bsonType: 'object',
            required: ['enabled'],
            properties: {
              enabled: { bsonType: 'bool' },
              secret: { bsonType: ['string', 'null'] },
              verifiedAt: { bsonType: ['date', 'null'] }
            }
          }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_users_phoneHash', key: { phoneHash: 1 }, unique: true },
      { name: 'ix_iam_users_city_status', key: { city: 1, status: 1 } },
      { name: 'ix_iam_users_createdAt', key: { createdAt: -1 } }
    ]
  },

  iam_otp_challenges: {
    name: 'iam_otp_challenges',
    module: 'iam',
    description: 'Temporary OTP challenge tokens with 10-minute auto-purge TTL',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['phoneHash', 'codeHash', 'expiresAt', 'attemptsRemaining', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          phoneHash: { bsonType: 'string' },
          codeHash: { bsonType: 'string' },
          expiresAt: { bsonType: 'date' },
          attemptsRemaining: { bsonType: 'int', minimum: 0 },
          ip: { bsonType: ['string', 'null'] },
          verifiedAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_iam_otp_challenges_expiresAt', key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      { name: 'ix_iam_otp_challenges_phoneHash', key: { phoneHash: 1 } }
    ]
  },

  iam_sessions: {
    name: 'iam_sessions',
    module: 'iam',
    description: 'Active user sessions with rotating refresh token family and auto-cleanup',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'refreshTokenHash', 'expiresAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          refreshTokenHash: { bsonType: 'string' },
          familyId: { bsonType: 'string' },
          deviceId: { bsonType: ['objectId', 'string', 'null'] },
          ip: { bsonType: ['string', 'null'] },
          userAgent: { bsonType: ['string', 'null'] },
          expiresAt: { bsonType: 'date' },
          revokedAt: { bsonType: ['date', 'null'] },
          revokedReason: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_iam_sessions_userId_revokedAt', key: { userId: 1, revokedAt: 1 } },
      { name: 'ix_iam_sessions_expiresAt', key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      { name: 'ux_iam_sessions_refreshTokenHash', key: { refreshTokenHash: 1 }, unique: true }
    ]
  },

  iam_roles: {
    name: 'iam_roles',
    module: 'iam',
    description: 'System roles definition',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['key', 'name', 'permissions', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          key: { bsonType: 'string' },
          name: { bsonType: 'string' },
          description: { bsonType: ['string', 'null'] },
          permissions: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          isSystem: { bsonType: 'bool' }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_roles_key', key: { key: 1 }, unique: true }
    ]
  },

  iam_permissions: {
    name: 'iam_permissions',
    module: 'iam',
    description: 'Granular permissions catalog (e.g. care.records.read, pay.refund.approve)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['action', 'module', 'description', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          action: { bsonType: 'string' },
          module: { bsonType: 'string' },
          description: { bsonType: 'string' }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_permissions_action', key: { action: 1 }, unique: true },
      { name: 'ix_iam_permissions_module', key: { module: 1 } }
    ]
  },

  iam_role_grants: {
    name: 'iam_role_grants',
    module: 'iam',
    description: 'Privileged role assignments requiring verification / maker-checker',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'role', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          role: { bsonType: 'string' },
          status: { bsonType: 'string', enum: ['pending', 'approved', 'rejected', 'revoked'] },
          approvedBy: { bsonType: ['objectId', 'null'] },
          approvedAt: { bsonType: ['date', 'null'] },
          notes: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_role_grants_userId_role', key: { userId: 1, role: 1 }, unique: true },
      { name: 'ix_iam_role_grants_status', key: { status: 1 } }
    ]
  },

  iam_api_keys: {
    name: 'iam_api_keys',
    module: 'iam',
    description: 'Machine-to-machine and API Gateway authorization keys',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'keyHash', 'prefix', 'permissions', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          name: { bsonType: 'string' },
          keyHash: { bsonType: 'string' },
          prefix: { bsonType: 'string' },
          permissions: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          status: { bsonType: 'string', enum: ['active', 'revoked'] },
          expiresAt: { bsonType: ['date', 'null'] },
          lastUsedAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_api_keys_keyHash', key: { keyHash: 1 }, unique: true },
      { name: 'ix_iam_api_keys_prefix', key: { prefix: 1 } }
    ]
  },

  iam_devices: {
    name: 'iam_devices',
    module: 'iam',
    description: 'Registered and allow-listed devices for privileged users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'deviceFingerprint', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          deviceFingerprint: { bsonType: 'string' },
          name: { bsonType: ['string', 'null'] },
          platform: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['trusted', 'pending', 'blocked'] },
          lastSeenAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_iam_devices_userId_fingerprint', key: { userId: 1, deviceFingerprint: 1 }, unique: true },
      { name: 'ix_iam_devices_userId_status', key: { userId: 1, status: 1 } }
    ]
  },

  // ==========================================
  // 2. PRF (Profiles) - 6 collections
  // ==========================================
  prf_patients: {
    name: 'prf_patients',
    module: 'prf',
    description: 'Patient demographic and clinical profile',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'fullName', 'city', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          fullName: { bsonType: 'string' },
          gender: { bsonType: ['string', 'null'], enum: ['male', 'female', 'other', null] },
          dob: { bsonType: ['date', 'null'] },
          bloodGroup: { bsonType: ['string', 'null'] },
          abhaNumber: { bsonType: ['string', 'null'] },
          abhaAddress: { bsonType: ['string', 'null'] },
          city: { bsonType: 'string' },
          address: { bsonType: ['string', 'null'] },
          emergencyContact: {
            bsonType: ['object', 'null'],
            properties: {
              name: { bsonType: 'string' },
              phone: { bsonType: 'string' },
              relationship: { bsonType: 'string' }
            }
          }
        }
      }
    },
    indexes: [
      { name: 'ux_prf_patients_userId', key: { userId: 1 }, unique: true },
      { name: 'ix_prf_patients_city', key: { city: 1 } },
      { name: 'ix_prf_patients_abhaNumber', key: { abhaNumber: 1 }, partialFilterExpression: { abhaNumber: { $type: 'string' } } }
    ]
  },

  prf_caregivers: {
    name: 'prf_caregivers',
    module: 'prf',
    description: 'Family or professional caregiver profiles',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'fullName', 'city', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          fullName: { bsonType: 'string' },
          city: { bsonType: 'string' },
          qualification: { bsonType: ['string', 'null'] },
          availabilityStatus: { bsonType: ['string', 'null'], enum: ['available', 'on_shift', 'unavailable', null] },
          organizationId: { bsonType: ['objectId', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_prf_caregivers_userId', key: { userId: 1 }, unique: true },
      { name: 'ix_prf_caregivers_city_status', key: { city: 1, availabilityStatus: 1 } }
    ]
  },

  prf_nurses: {
    name: 'prf_nurses',
    module: 'prf',
    description: 'Registered nurse profiles with council registration details',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'fullName', 'registrationNumber', 'city', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          fullName: { bsonType: 'string' },
          registrationNumber: { bsonType: 'string' },
          councilName: { bsonType: ['string', 'null'] },
          city: { bsonType: 'string' },
          organizationId: { bsonType: ['objectId', 'null'] },
          verificationStatus: { bsonType: 'string', enum: ['verified', 'pending', 'rejected'] }
        }
      }
    },
    indexes: [
      { name: 'ux_prf_nurses_userId', key: { userId: 1 }, unique: true },
      { name: 'ix_prf_nurses_city', key: { city: 1 } },
      { name: 'ux_prf_nurses_regNo', key: { registrationNumber: 1 }, unique: true }
    ]
  },

  prf_clinicians: {
    name: 'prf_clinicians',
    module: 'prf',
    description: 'Physician and clinician profiles with medical council registration',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'fullName', 'medicalCouncilRegNo', 'specialty', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          fullName: { bsonType: 'string' },
          medicalCouncilRegNo: { bsonType: 'string' },
          specialty: { bsonType: 'string' },
          qualification: { bsonType: ['string', 'null'] },
          city: { bsonType: 'string' },
          organizationId: { bsonType: ['objectId', 'null'] },
          verificationStatus: { bsonType: 'string', enum: ['verified', 'pending', 'rejected'] }
        }
      }
    },
    indexes: [
      { name: 'ux_prf_clinicians_userId', key: { userId: 1 }, unique: true },
      { name: 'ix_prf_clinicians_specialty', key: { specialty: 1 } },
      { name: 'ux_prf_clinicians_regNo', key: { medicalCouncilRegNo: 1 }, unique: true }
    ]
  },

  prf_organisations: {
    name: 'prf_organisations',
    module: 'prf',
    description: 'Healthcare organizations, hospitals, clinics, and ACO entities',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'type', 'city', 'gstin', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          name: { bsonType: 'string' },
          type: { bsonType: 'string', enum: ['hospital', 'clinic', 'aco', 'pharmacy', 'agency'] },
          city: { bsonType: 'string' },
          gstin: { bsonType: ['string', 'null'] },
          pan: { bsonType: ['string', 'null'] },
          address: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['active', 'suspended'] }
        }
      }
    },
    indexes: [
      { name: 'ix_prf_organisations_type_city', key: { type: 1, city: 1 } },
      { name: 'ix_prf_organisations_status', key: { status: 1 } }
    ]
  },

  prf_care_relationships: {
    name: 'prf_care_relationships',
    module: 'prf',
    description: 'Active relationship bindings authorizing caregiver/clinician access to a patient',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'granteeId', 'role', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          granteeId: { bsonType: 'objectId', description: 'User ID of caregiver, nurse or clinician' },
          role: { bsonType: 'string', enum: ['caregiver', 'family', 'nurse', 'clinician'] },
          status: { bsonType: 'string', enum: ['active', 'inactive', 'revoked'] },
          relationshipType: { bsonType: ['string', 'null'] }, // e.g. 'daughter', 'primary_physician'
          expiresAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_prf_care_rel_patient_grantee', key: { patientId: 1, granteeId: 1, role: 1 }, unique: true },
      { name: 'ix_prf_care_rel_granteeId_status', key: { granteeId: 1, status: 1 } },
      { name: 'ix_prf_care_rel_patientId_status', key: { patientId: 1, status: 1 } }
    ]
  },

  // ==========================================
  // 3. CARE (Care Delivery) - 12 collections
  // ==========================================
  care_appointments: {
    name: 'care_appointments',
    module: 'care',
    description: 'Doctor and therapy scheduled appointments',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'scheduledAt', 'type', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          clinicianId: { bsonType: ['objectId', 'null'] },
          type: { bsonType: 'string', enum: ['in_person', 'home_visit', 'telehealth'] },
          scheduledAt: { bsonType: 'date' },
          durationMinutes: { bsonType: 'int', minimum: 5 },
          status: { bsonType: 'string', enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'] },
          reason: { bsonType: ['string', 'null'] },
          location: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_appointments_patientId_scheduledAt', key: { patientId: 1, scheduledAt: 1 } },
      { name: 'ix_care_appointments_clinicianId_scheduledAt', key: { clinicianId: 1, scheduledAt: 1 } },
      { name: 'ix_care_appointments_status', key: { status: 1 } }
    ]
  },

  care_visits: {
    name: 'care_visits',
    module: 'care',
    description: 'Home visits by caregivers or nurses with geo-fenced check-in',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'caregiverId', 'scheduledAt', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          caregiverId: { bsonType: 'objectId' },
          scheduledAt: { bsonType: 'date' },
          status: { bsonType: 'string', enum: ['pending', 'in_progress', 'completed', 'missed', 'cancelled'] },
          checkIn: {
            bsonType: ['object', 'null'],
            properties: {
              at: { bsonType: 'date' },
              geo: {
                bsonType: ['object', 'null'],
                properties: {
                  type: { bsonType: 'string', enum: ['Point'] },
                  coordinates: {
                    bsonType: 'array',
                    items: { bsonType: 'number' },
                    minItems: 2,
                    maxItems: 2
                  }
                }
              }
            }
          },
          checkOut: {
            bsonType: ['object', 'null'],
            properties: {
              at: { bsonType: 'date' },
              geo: { bsonType: ['object', 'null'] }
            }
          },
          notesCount: { bsonType: 'int', minimum: 0 }
        }
      }
    },
    indexes: [
      { name: 'ix_care_visits_patientId_scheduledAt', key: { patientId: 1, scheduledAt: 1 } },
      { name: 'ix_care_visits_caregiverId_status', key: { caregiverId: 1, status: 1 } },
      { name: 'ix_care_visits_status', key: { status: 1 } }
    ]
  },

  care_visit_notes: {
    name: 'care_visit_notes',
    module: 'care',
    description: 'Caregiver visit observation and clinical notes',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['visitId', 'patientId', 'authorId', 'content', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          visitId: { bsonType: 'objectId' },
          patientId: { bsonType: 'objectId' },
          authorId: { bsonType: 'objectId' },
          content: { bsonType: 'string', description: 'Encrypted clinical observation notes' },
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          }
        }
      }
    },
    indexes: [
      { name: 'ix_care_visit_notes_visitId', key: { visitId: 1 } },
      { name: 'ix_care_visit_notes_patientId_createdAt', key: { patientId: 1, createdAt: -1 } }
    ]
  },

  care_tasks: {
    name: 'care_tasks',
    module: 'care',
    description: 'Daily care plan tasks (meals, exercise, hygiene, dressing)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'title', 'scheduledDate', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          assignedToId: { bsonType: ['objectId', 'null'] },
          title: { bsonType: 'string' },
          description: { bsonType: ['string', 'null'] },
          scheduledDate: { bsonType: 'date' },
          status: { bsonType: 'string', enum: ['pending', 'completed', 'skipped'] },
          completedAt: { bsonType: ['date', 'null'] },
          completedById: { bsonType: ['objectId', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_tasks_patientId_scheduledDate', key: { patientId: 1, scheduledDate: 1 } },
      { name: 'ix_care_tasks_assignedToId_status', key: { assignedToId: 1, status: 1 } }
    ]
  },

  care_medications: {
    name: 'care_medications',
    module: 'care',
    description: 'Active medications schedule, dosages and adherence logging',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'name', 'dosage', 'frequency', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          prescriptionId: { bsonType: ['objectId', 'null'] },
          name: { bsonType: 'string' },
          dosage: { bsonType: 'string' }, // e.g. "500mg"
          frequency: { bsonType: 'string' }, // e.g. "Twice daily after food"
          status: { bsonType: 'string', enum: ['active', 'paused', 'completed', 'discontinued'] },
          startDate: { bsonType: ['date', 'null'] },
          endDate: { bsonType: ['date', 'null'] },
          instructions: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_medications_patientId_status', key: { patientId: 1, status: 1 } }
    ]
  },

  care_prescriptions: {
    name: 'care_prescriptions',
    module: 'care',
    description: 'Clinician written prescriptions with digital sign-off',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'clinicianId', 'medicines', 'issuedAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          clinicianId: { bsonType: 'objectId' },
          medicines: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['name', 'dosage', 'frequency'],
              properties: {
                name: { bsonType: 'string' },
                dosage: { bsonType: 'string' },
                frequency: { bsonType: 'string' },
                durationDays: { bsonType: ['int', 'null'] }
              }
            }
          },
          diagnosis: { bsonType: ['string', 'null'] },
          issuedAt: { bsonType: 'date' },
          signatureRef: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_prescriptions_patientId_issuedAt', key: { patientId: 1, issuedAt: -1 } },
      { name: 'ix_care_prescriptions_clinicianId', key: { clinicianId: 1 } }
    ]
  },

  care_vitals: {
    name: 'care_vitals',
    module: 'care',
    description: 'High-volume time-series physiological vitals (BP, SpO2, Pulse, Temp, Glucose)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'recordedAt', 'vitalType', 'value', 'unit', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          recordedById: { bsonType: ['objectId', 'null'] },
          recordedAt: { bsonType: 'date' },
          vitalType: { bsonType: 'string', enum: ['blood_pressure', 'heart_rate', 'spo2', 'temperature', 'blood_glucose', 'respiratory_rate'] },
          value: { bsonType: ['number', 'string'] }, // string for BP e.g. "120/80"
          unit: { bsonType: 'string' },
          isAbnormal: { bsonType: ['bool', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_vitals_patientId_recordedAt', key: { patientId: 1, recordedAt: -1 } },
      { name: 'ix_care_vitals_type_recordedAt', key: { vitalType: 1, recordedAt: -1 } }
    ]
  },

  care_records: {
    name: 'care_records',
    module: 'care',
    description: 'Medical history, lab reports, discharge files, FHIR documents',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'type', 'title', 'documentUrl', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          type: { bsonType: 'string', enum: ['lab_report', 'radiology', 'discharge_summary', 'prescription', 'fhir_r4'] },
          title: { bsonType: 'string' },
          documentUrl: { bsonType: 'string' },
          fileSize: { bsonType: ['int', 'null'] },
          mimeType: { bsonType: ['string', 'null'] },
          recordedDate: { bsonType: ['date', 'null'] },
          fhirBundle: { bsonType: ['object', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_records_patientId_type', key: { patientId: 1, type: 1 } },
      { name: 'ix_care_records_patientId_createdAt', key: { patientId: 1, createdAt: -1 } }
    ]
  },

  care_orders: {
    name: 'care_orders',
    module: 'care',
    description: 'Doctor clinical orders for labs, nursing interventions, or diagnostic tests',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'clinicianId', 'orderType', 'details', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          clinicianId: { bsonType: 'objectId' },
          orderType: { bsonType: 'string', enum: ['lab_test', 'nursing_procedure', 'radiology', 'physiotherapy'] },
          details: { bsonType: 'string' },
          priority: { bsonType: ['string', 'null'], enum: ['stat', 'urgent', 'routine', null] },
          status: { bsonType: 'string', enum: ['ordered', 'in_progress', 'completed', 'cancelled'] },
          fulfilledAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_orders_patientId_status', key: { patientId: 1, status: 1 } },
      { name: 'ix_care_orders_clinicianId', key: { clinicianId: 1 } }
    ]
  },

  care_shifts: {
    name: 'care_shifts',
    module: 'care',
    description: 'Nurse and caregiver shift rosters, handovers, and coverage',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['workerId', 'startTime', 'endTime', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          workerId: { bsonType: 'objectId' },
          role: { bsonType: ['string', 'null'], enum: ['nurse', 'caregiver', 'remote_desk', null] },
          startTime: { bsonType: 'date' },
          endTime: { bsonType: 'date' },
          status: { bsonType: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
          handoverNotes: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_shifts_workerId_startTime', key: { workerId: 1, startTime: 1 } },
      { name: 'ix_care_shifts_status', key: { status: 1 } }
    ]
  },

  care_escalations: {
    name: 'care_escalations',
    module: 'care',
    description: 'Red-flag clinical alerts, vital abnormalities, and SOS tickets',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'severity', 'reason', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          reportedById: { bsonType: ['objectId', 'null'] },
          severity: { bsonType: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          reason: { bsonType: 'string' },
          status: { bsonType: 'string', enum: ['open', 'investigating', 'resolved', 'dismissed'] },
          resolvedAt: { bsonType: ['date', 'null'] },
          resolvedById: { bsonType: ['objectId', 'null'] },
          resolutionNotes: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_escalations_patientId_status', key: { patientId: 1, status: 1 } },
      { name: 'ix_care_escalations_severity_status', key: { severity: 1, status: 1 } }
    ]
  },

  care_discharge_plans: {
    name: 'care_discharge_plans',
    module: 'care',
    description: 'Post-hospitalization transition plans, recovery milestones, and followup',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'clinicianId', 'dischargeDate', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          clinicianId: { bsonType: 'objectId' },
          dischargeDate: { bsonType: 'date' },
          diagnosis: { bsonType: ['string', 'null'] },
          summary: { bsonType: ['string', 'null'] },
          instructions: { bsonType: ['string', 'null'] },
          followUpDate: { bsonType: ['date', 'null'] },
          status: { bsonType: 'string', enum: ['draft', 'active', 'completed'] }
        }
      }
    },
    indexes: [
      { name: 'ix_care_discharge_plans_patientId', key: { patientId: 1 } },
      { name: 'ix_care_discharge_plans_status', key: { status: 1 } }
    ]
  },

  // ==========================================
  // 4. ACO (Health Plan & Outcomes) - 4 collections
  // ==========================================
  aco_cohorts: {
    name: 'aco_cohorts',
    module: 'aco',
    description: 'Patient population health cohorts (e.g. Diabetic, Cardiac Care, Geriatric)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'condition', 'criteria', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          name: { bsonType: 'string' },
          condition: { bsonType: 'string' },
          criteria: { bsonType: 'object' },
          patientCount: { bsonType: ['int', 'null'] },
          status: { bsonType: 'string', enum: ['active', 'archived'] }
        }
      }
    },
    indexes: [
      { name: 'ux_aco_cohorts_name', key: { name: 1 }, unique: true }
    ]
  },

  aco_measures: {
    name: 'aco_measures',
    module: 'aco',
    description: 'Clinical quality metrics, HEDIS-equivalent indicators, benchmark targets',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['code', 'name', 'category', 'targetRate', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          code: { bsonType: 'string' },
          name: { bsonType: 'string' },
          category: { bsonType: 'string' },
          targetRate: { bsonType: 'number' },
          currentRate: { bsonType: ['number', 'null'] },
          period: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_aco_measures_code', key: { code: 1 }, unique: true },
      { name: 'ix_aco_measures_category', key: { category: 1 } }
    ]
  },

  aco_outcomes: {
    name: 'aco_outcomes',
    module: 'aco',
    description: 'Patient outcome evaluation scores and readmission rates',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'cohortId', 'score', 'evaluatedAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          cohortId: { bsonType: 'objectId' },
          score: { bsonType: 'number' },
          readmission30d: { bsonType: ['bool', 'null'] },
          evaluatedAt: { bsonType: 'date' },
          notes: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_aco_outcomes_patientId_evaluatedAt', key: { patientId: 1, evaluatedAt: -1 } },
      { name: 'ix_aco_outcomes_cohortId', key: { cohortId: 1 } }
    ]
  },

  aco_programs: {
    name: 'aco_programs',
    module: 'aco',
    description: 'Managed preventive care programs and value-based contracts',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'payerOrganizationId', 'startDate', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          name: { bsonType: 'string' },
          payerOrganizationId: { bsonType: 'objectId' },
          startDate: { bsonType: 'date' },
          endDate: { bsonType: ['date', 'null'] },
          status: { bsonType: 'string', enum: ['active', 'paused', 'terminated'] }
        }
      }
    },
    indexes: [
      { name: 'ix_aco_programs_payerOrgId', key: { payerOrganizationId: 1 } }
    ]
  },

  // ==========================================
  // 5. VAC (Adult Vaccination) - 4 collections
  // ==========================================
  vac_schedules: {
    name: 'vac_schedules',
    module: 'vac',
    description: 'Recommended adult immunization schedules and disease targets',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['vaccineName', 'targetAgeMin', 'dosesRequired', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          vaccineName: { bsonType: 'string' },
          targetDisease: { bsonType: ['string', 'null'] },
          targetAgeMin: { bsonType: 'int', minimum: 18 },
          dosesRequired: { bsonType: 'int', minimum: 1 },
          intervalDays: { bsonType: ['int', 'null'] },
          description: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_vac_schedules_vaccineName', key: { vaccineName: 1 }, unique: true }
    ]
  },

  vac_doses: {
    name: 'vac_doses',
    module: 'vac',
    description: 'Administered vaccination doses, lot numbers, administering nurse',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'scheduleId', 'doseNumber', 'administeredAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          scheduleId: { bsonType: 'objectId' },
          doseNumber: { bsonType: 'int', minimum: 1 },
          batchNumber: { bsonType: ['string', 'null'] },
          administeredAt: { bsonType: 'date' },
          administeredById: { bsonType: ['objectId', 'null'] },
          status: { bsonType: 'string', enum: ['scheduled', 'completed', 'cancelled'] },
          adverseReaction: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_vac_doses_patientId_scheduleId', key: { patientId: 1, scheduleId: 1 } },
      { name: 'ix_vac_doses_administeredAt', key: { administeredAt: -1 } }
    ]
  },

  vac_certificates: {
    name: 'vac_certificates',
    module: 'vac',
    description: 'Digital vaccination completion certificates with QR verification',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['certificateNo', 'patientId', 'scheduleId', 'issuedAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          certificateNo: { bsonType: 'string' },
          patientId: { bsonType: 'objectId' },
          scheduleId: { bsonType: 'objectId' },
          issuedAt: { bsonType: 'date' },
          qrCodePayload: { bsonType: ['string', 'null'] },
          downloadUrl: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_vac_certificates_certificateNo', key: { certificateNo: 1 }, unique: true },
      { name: 'ix_vac_certificates_patientId', key: { patientId: 1 } }
    ]
  },

  vac_inventory: {
    name: 'vac_inventory',
    module: 'vac',
    description: 'Cold-chain vaccine stock, vials, batch expiry tracking',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['vaccineName', 'batchNumber', 'unitsAvailable', 'expiryDate', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          vaccineName: { bsonType: 'string' },
          batchNumber: { bsonType: 'string' },
          unitsAvailable: { bsonType: 'int', minimum: 0 },
          expiryDate: { bsonType: 'date' },
          coldChainTempCelsius: { bsonType: ['number', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_vac_inventory_batchNumber', key: { batchNumber: 1 }, unique: true },
      { name: 'ix_vac_inventory_expiryDate', key: { expiryDate: 1 } }
    ]
  },

  // ==========================================
  // 6. MKT (Marketplace) - 7 collections
  // ==========================================
  mkt_products: {
    name: 'mkt_products',
    module: 'mkt',
    description: 'Healthcare devices, consumables, and care service packages',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'sku', 'priceMinor', 'currency', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          name: { bsonType: 'string' },
          sku: { bsonType: 'string' },
          categoryId: { bsonType: ['objectId', 'null'] },
          sellerId: { bsonType: ['objectId', 'null'] },
          description: { bsonType: ['string', 'null'] },
          priceMinor: { bsonType: 'int', minimum: 0, description: 'Price in paise' },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          stockQuantity: { bsonType: 'int', minimum: 0 },
          status: { bsonType: 'string', enum: ['active', 'out_of_stock', 'discontinued'] },
          hsnSac: { bsonType: ['string', 'null'] },
          gstRatePercent: { bsonType: ['number', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_mkt_products_sku', key: { sku: 1 }, unique: true },
      { name: 'ix_mkt_products_categoryId_status', key: { categoryId: 1, status: 1 } }
    ]
  },

  mkt_categories: {
    name: 'mkt_categories',
    module: 'mkt',
    description: 'Product and care service categories',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['slug', 'name', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          slug: { bsonType: 'string' },
          name: { bsonType: 'string' },
          description: { bsonType: ['string', 'null'] },
          parentId: { bsonType: ['objectId', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_mkt_categories_slug', key: { slug: 1 }, unique: true }
    ]
  },

  mkt_sellers: {
    name: 'mkt_sellers',
    module: 'mkt',
    description: 'Onboarded vendors, pharmacy partners, equipment suppliers',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['companyName', 'gstin', 'pan', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          companyName: { bsonType: 'string' },
          gstin: { bsonType: 'string' },
          pan: { bsonType: 'string' },
          contactEmail: { bsonType: ['string', 'null'] },
          contactPhone: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['active', 'pending_approval', 'suspended'] }
        }
      }
    },
    indexes: [
      { name: 'ux_mkt_sellers_gstin', key: { gstin: 1 }, unique: true },
      { name: 'ix_mkt_sellers_status', key: { status: 1 } }
    ]
  },

  mkt_carts: {
    name: 'mkt_carts',
    module: 'mkt',
    description: 'User shopping carts before checkout conversion',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'items', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          items: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { bsonType: 'objectId' },
                quantity: { bsonType: 'int', minimum: 1 }
              }
            }
          }
        }
      }
    },
    indexes: [
      { name: 'ux_mkt_carts_userId', key: { userId: 1 }, unique: true }
    ]
  },

  mkt_orders: {
    name: 'mkt_orders',
    module: 'mkt',
    description: 'Marketplace orders with gapless numbering and payment tracking',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderNo', 'buyerId', 'totalMinor', 'currency', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          orderNo: { bsonType: 'string' },
          buyerId: { bsonType: 'objectId' },
          totalMinor: { bsonType: 'int', minimum: 0 },
          subtotalMinor: { bsonType: ['int', 'null'] },
          taxMinor: { bsonType: ['int', 'null'] },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          status: { bsonType: 'string', enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] },
          shippingAddress: { bsonType: ['object', 'null'] },
          billingAddress: { bsonType: ['object', 'null'] },
          invoiceId: { bsonType: ['objectId', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_mkt_orders_orderNo', key: { orderNo: 1 }, unique: true },
      { name: 'ix_mkt_orders_buyerId_createdAt', key: { buyerId: 1, createdAt: -1 } },
      { name: 'ix_mkt_orders_status', key: { status: 1 } }
    ]
  },

  mkt_order_items: {
    name: 'mkt_order_items',
    module: 'mkt',
    description: 'Line items within a marketplace order',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'productId', 'quantity', 'unitPriceMinor', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          orderId: { bsonType: 'objectId' },
          productId: { bsonType: 'objectId' },
          quantity: { bsonType: 'int', minimum: 1 },
          unitPriceMinor: { bsonType: 'int', minimum: 0 },
          totalMinor: { bsonType: ['int', 'null'] },
          taxMinor: { bsonType: ['int', 'null'] },
          hsnSac: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_mkt_order_items_orderId', key: { orderId: 1 } }
    ]
  },

  mkt_shipments: {
    name: 'mkt_shipments',
    module: 'mkt',
    description: 'Fulfillment shipments, courier airway bills, tracking milestones',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'carrier', 'trackingNumber', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          orderId: { bsonType: 'objectId' },
          carrier: { bsonType: 'string' },
          trackingNumber: { bsonType: 'string' },
          status: { bsonType: 'string', enum: ['created', 'in_transit', 'out_for_delivery', 'delivered', 'failed'] },
          dispatchedAt: { bsonType: ['date', 'null'] },
          deliveredAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_mkt_shipments_orderId', key: { orderId: 1 } },
      { name: 'ux_mkt_shipments_tracking', key: { carrier: 1, trackingNumber: 1 }, unique: true }
    ]
  },

  // ==========================================
  // 7. PAY (Payments & Finance) - 10 collections
  // ==========================================
  pay_transactions: {
    name: 'pay_transactions',
    module: 'pay',
    description: 'Captured and verified payment transactions from Razorpay / Stripe',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'gateway', 'gatewayPaymentId', 'amountMinor', 'currency', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          orderId: { bsonType: 'objectId' },
          gateway: { bsonType: 'string', enum: ['razorpay', 'stripe'] },
          gatewayPaymentId: { bsonType: 'string' },
          amountMinor: { bsonType: 'int', minimum: 0 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          status: { bsonType: 'string', enum: ['created', 'authorized', 'captured', 'refunded', 'failed'] },
          method: { bsonType: ['string', 'null'] }, // upi, card, netbanking
          capturedAt: { bsonType: ['date', 'null'] },
          settlementId: { bsonType: ['objectId', 'null'] },
          idempotencyKey: { bsonType: ['string', 'null'] },
          refundedAmountMinor: { bsonType: ['int', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_transactions_gatewayPaymentId', key: { gatewayPaymentId: 1 }, unique: true },
      { name: 'ix_pay_transactions_status_capturedAt', key: { status: 1, capturedAt: -1 } },
      { name: 'ix_pay_transactions_orderId', key: { orderId: 1 } },
      { name: 'ix_pay_transactions_settlementId', key: { settlementId: 1 } }
    ]
  },

  pay_payment_intents: {
    name: 'pay_payment_intents',
    module: 'pay',
    description: 'Payment session intent records initiated by the backend before client pays',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['orderId', 'gateway', 'gatewayOrderId', 'amountMinor', 'currency', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          orderId: { bsonType: 'objectId' },
          gateway: { bsonType: 'string', enum: ['razorpay', 'stripe'] },
          gatewayOrderId: { bsonType: 'string' },
          amountMinor: { bsonType: 'int', minimum: 0 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          status: { bsonType: 'string', enum: ['created', 'processed', 'cancelled', 'expired'] },
          idempotencyKey: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_payment_intents_gatewayOrderId', key: { gatewayOrderId: 1 }, unique: true },
      { name: 'ix_pay_payment_intents_orderId', key: { orderId: 1 } }
    ]
  },

  pay_webhook_events: {
    name: 'pay_webhook_events',
    module: 'pay',
    description: 'Raw signed gateway webhook events with 90-day retention TTL',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['gateway', 'eventId', 'eventType', 'payload', 'processedStatus', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          gateway: { bsonType: 'string', enum: ['razorpay', 'stripe'] },
          eventId: { bsonType: 'string' },
          eventType: { bsonType: 'string' },
          payload: { bsonType: 'object' },
          processedStatus: { bsonType: 'string', enum: ['pending', 'processed', 'failed', 'ignored'] },
          processedAt: { bsonType: ['date', 'null'] },
          error: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_webhook_events_eventId', key: { eventId: 1 }, unique: true },
      { name: 'ix_pay_webhook_events_createdAt', key: { createdAt: 1 }, expireAfterSeconds: 7776000 }, // 90 days TTL
      { name: 'ix_pay_webhook_events_status', key: { processedStatus: 1 } }
    ]
  },

  pay_settlements: {
    name: 'pay_settlements',
    module: 'pay',
    description: 'Gateway payout batch settlements and fee deductions',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['gateway', 'settlementRef', 'grossMinor', 'feeMinor', 'taxMinor', 'netMinor', 'settledAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          gateway: { bsonType: 'string', enum: ['razorpay', 'stripe'] },
          settlementRef: { bsonType: 'string' },
          grossMinor: { bsonType: 'int', minimum: 0 },
          feeMinor: { bsonType: 'int', minimum: 0 },
          taxMinor: { bsonType: 'int', minimum: 0 },
          netMinor: { bsonType: 'int', minimum: 0 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          settledAt: { bsonType: 'date' },
          utr: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_settlements_gateway_ref', key: { gateway: 1, settlementRef: 1 }, unique: true },
      { name: 'ix_pay_settlements_settledAt', key: { settledAt: -1 } }
    ]
  },

  pay_refunds: {
    name: 'pay_refunds',
    module: 'pay',
    description: 'Maker-checker approved refunds against captured transactions',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['transactionId', 'amountMinor', 'currency', 'status', 'makerId', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          transactionId: { bsonType: 'objectId' },
          gatewayRefundId: { bsonType: ['string', 'null'] },
          amountMinor: { bsonType: 'int', minimum: 1 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          reason: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['pending_approval', 'approved', 'processed', 'rejected', 'failed'] },
          makerId: { bsonType: 'objectId' },
          checkerId: { bsonType: ['objectId', 'null'] },
          approvedAt: { bsonType: ['date', 'null'] },
          creditNoteId: { bsonType: ['objectId', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_pay_refunds_transactionId', key: { transactionId: 1 } },
      { name: 'ix_pay_refunds_status', key: { status: 1 } }
    ]
  },

  pay_invoices: {
    name: 'pay_invoices',
    module: 'pay',
    description: 'Gapless financial year compliant tax invoices with GST and QR',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['invoiceNo', 'orderId', 'buyerId', 'financialYear', 'totalMinor', 'currency', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          invoiceNo: { bsonType: 'string', description: 'e.g. VQ/2026-27/000123' },
          financialYear: { bsonType: 'string' },
          orderId: { bsonType: 'objectId' },
          buyerId: { bsonType: 'objectId' },
          buyerGstin: { bsonType: ['string', 'null'] },
          sellerGstin: { bsonType: ['string', 'null'] },
          subtotalMinor: { bsonType: ['int', 'null'] },
          cgstMinor: { bsonType: ['int', 'null'] },
          sgstMinor: { bsonType: ['int', 'null'] },
          igstMinor: { bsonType: ['int', 'null'] },
          totalMinor: { bsonType: 'int', minimum: 0 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          irn: { bsonType: ['string', 'null'], description: 'E-invoice Invoice Reference Number' },
          qrCode: { bsonType: ['string', 'null'] },
          pdfUrl: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_invoices_invoiceNo', key: { invoiceNo: 1 }, unique: true },
      { name: 'ix_pay_invoices_orderId', key: { orderId: 1 } },
      { name: 'ix_pay_invoices_buyerId_fy', key: { buyerId: 1, financialYear: 1 } }
    ]
  },

  pay_credit_notes: {
    name: 'pay_credit_notes',
    module: 'pay',
    description: 'GST-compliant credit notes issued for refunds',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['creditNoteNo', 'invoiceId', 'refundId', 'amountMinor', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          creditNoteNo: { bsonType: 'string' },
          invoiceId: { bsonType: 'objectId' },
          refundId: { bsonType: 'objectId' },
          amountMinor: { bsonType: 'int', minimum: 1 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          taxReversedMinor: { bsonType: ['int', 'null'] },
          reason: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_pay_credit_notes_creditNoteNo', key: { creditNoteNo: 1 }, unique: true },
      { name: 'ix_pay_credit_notes_invoiceId', key: { invoiceId: 1 } }
    ]
  },

  pay_receivables: {
    name: 'pay_receivables',
    module: 'pay',
    description: 'B2B and Health Plan aged accounts receivable ledger (0-30, 31-60, 61-90, 90+ days)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['debtorId', 'invoiceId', 'amountDueMinor', 'bucket', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          debtorId: { bsonType: 'objectId' },
          invoiceId: { bsonType: 'objectId' },
          amountDueMinor: { bsonType: 'int', minimum: 0 },
          currency: { bsonType: 'string', enum: ['INR', 'USD', 'EUR'] },
          dueDate: { bsonType: ['date', 'null'] },
          bucket: { bsonType: 'string', enum: ['0-30', '31-60', '61-90', '90+'] },
          status: { bsonType: 'string', enum: ['unpaid', 'partially_paid', 'paid', 'written_off'] }
        }
      }
    },
    indexes: [
      { name: 'ix_pay_receivables_debtorId_status', key: { debtorId: 1, status: 1 } },
      { name: 'ix_pay_receivables_bucket', key: { bucket: 1 } }
    ]
  },

  pay_reconciliations: {
    name: 'pay_reconciliations',
    module: 'pay',
    description: '3-way automated matching between internal transactions, gateway events and bank statements',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['runDate', 'totalTransactions', 'matchedCount', 'unmatchedCount', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          runDate: { bsonType: 'date' },
          totalTransactions: { bsonType: 'int', minimum: 0 },
          matchedCount: { bsonType: 'int', minimum: 0 },
          unmatchedCount: { bsonType: 'int', minimum: 0 },
          discrepancyMinor: { bsonType: ['int', 'null'] },
          status: { bsonType: 'string', enum: ['reconciled', 'discrepancy_detected', 'approved'] },
          discrepancyDetails: { bsonType: ['array', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_pay_reconciliations_runDate', key: { runDate: -1 } },
      { name: 'ix_pay_reconciliations_status', key: { status: 1 } }
    ]
  },

  pay_gst_ledger: {
    name: 'pay_gst_ledger',
    module: 'pay',
    description: 'Immutable tax journal line items for monthly GSTR statutory reporting',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['taxPeriod', 'invoiceId', 'taxableAmountMinor', 'cgstMinor', 'sgstMinor', 'igstMinor', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          taxPeriod: { bsonType: 'string', description: 'YYYY-MM format' },
          invoiceId: { bsonType: 'objectId' },
          creditNoteId: { bsonType: ['objectId', 'null'] },
          taxableAmountMinor: { bsonType: 'int' },
          cgstMinor: { bsonType: 'int' },
          sgstMinor: { bsonType: 'int' },
          igstMinor: { bsonType: 'int' },
          isReversal: { bsonType: 'bool' }
        }
      }
    },
    indexes: [
      { name: 'ix_pay_gst_ledger_taxPeriod', key: { taxPeriod: 1 } },
      { name: 'ix_pay_gst_ledger_invoiceId', key: { invoiceId: 1 } }
    ]
  },

  // ==========================================
  // 8. CMP (Compliance) - 6 collections
  // ==========================================
  cmp_controls: {
    name: 'cmp_controls',
    module: 'cmp',
    description: 'ISO 27001, SOC 2 and DPDP statutory control checklist items',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['code', 'framework', 'title', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          code: { bsonType: 'string' },
          framework: { bsonType: 'string', enum: ['DPDP_2023', 'ISO_27001', 'SOC_2', 'RBI_DATA', 'CERT_IN'] },
          title: { bsonType: 'string' },
          description: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['compliant', 'in_progress', 'non_compliant', 'not_applicable'] },
          owner: { bsonType: ['string', 'null'] },
          lastAuditedAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_cmp_controls_code', key: { code: 1 }, unique: true },
      { name: 'ix_cmp_controls_framework_status', key: { framework: 1, status: 1 } }
    ]
  },

  cmp_approvals: {
    name: 'cmp_approvals',
    module: 'cmp',
    description: 'Maker-checker approval queue for refunds, role changes, filings',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['type', 'resourceType', 'resourceId', 'makerId', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          type: { bsonType: 'string', enum: ['refund', 'role_grant', 'reconciliation_discrepancy', 'policy_change', 'dsr_erasure'] },
          resourceType: { bsonType: 'string' },
          resourceId: { bsonType: 'objectId' },
          makerId: { bsonType: 'objectId' },
          checkerId: { bsonType: ['objectId', 'null'] },
          status: { bsonType: 'string', enum: ['pending', 'approved', 'rejected'] },
          decisionNotes: { bsonType: ['string', 'null'] },
          decidedAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_cmp_approvals_status_type', key: { status: 1, type: 1 } },
      { name: 'ix_cmp_approvals_resource', key: { resourceType: 1, resourceId: 1 } }
    ]
  },

  cmp_filings: {
    name: 'cmp_filings',
    module: 'cmp',
    description: 'Statutory filings (GSTR-1, GSTR-3B, CERT-In incidents, DPDP reports)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['type', 'period', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          type: { bsonType: 'string', enum: ['GSTR_1', 'GSTR_3B', 'CERT_IN_LOG', 'DPDP_AUDIT'] },
          period: { bsonType: 'string' },
          filedAt: { bsonType: ['date', 'null'] },
          status: { bsonType: 'string', enum: ['draft', 'submitted', 'acknowledged', 'rejected'] },
          ackNumber: { bsonType: ['string', 'null'] },
          documentUrl: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_cmp_filings_type_period', key: { type: 1, period: 1 } }
    ]
  },

  cmp_consents: {
    name: 'cmp_consents',
    module: 'cmp',
    description: 'Purpose-bound patient consent records under DPDP Act 2023 & ABDM',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'purpose', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          patientId: { bsonType: 'objectId' },
          granteeId: { bsonType: ['objectId', 'null'] },
          purpose: { bsonType: 'string', enum: ['care_delivery', 'health_plan_analytics', 'research', 'emergency_breakglass'] },
          status: { bsonType: 'string', enum: ['active', 'revoked', 'expired'] },
          grantedAt: { bsonType: ['date', 'null'] },
          revokedAt: { bsonType: ['date', 'null'] },
          expiresAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_cmp_consents_patientId_purpose_status', key: { patientId: 1, purpose: 1, status: 1 } },
      { name: 'ix_cmp_consents_granteeId', key: { granteeId: 1 } }
    ]
  },

  cmp_dsr_requests: {
    name: 'cmp_dsr_requests',
    module: 'cmp',
    description: 'DPDP Data Subject Requests (access, data download, correction, erasure)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'type', 'status', 'dueAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          type: { bsonType: 'string', enum: ['access', 'data_export', 'correction', 'erasure', 'nomination'] },
          status: { bsonType: 'string', enum: ['received', 'processing', 'completed', 'rejected'] },
          dueAt: { bsonType: 'date', description: '30-day statutory SLA date' },
          completedAt: { bsonType: ['date', 'null'] },
          exportJobId: { bsonType: ['objectId', 'null'] },
          legalHoldExempt: { bsonType: ['bool', 'null'] },
          rejectionReason: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_cmp_dsr_requests_userId_type', key: { userId: 1, type: 1 } },
      { name: 'ix_cmp_dsr_requests_status_dueAt', key: { status: 1, dueAt: 1 } }
    ]
  },

  cmp_policies: {
    name: 'cmp_policies',
    module: 'cmp',
    description: 'Versioned compliance policies, privacy notice terms and clinical retention guidelines',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['code', 'version', 'title', 'content', 'effectiveDate', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          code: { bsonType: 'string' },
          version: { bsonType: 'string' },
          title: { bsonType: 'string' },
          content: { bsonType: 'string' },
          effectiveDate: { bsonType: 'date' },
          isActive: { bsonType: 'bool' }
        }
      }
    },
    indexes: [
      { name: 'ux_cmp_policies_code_version', key: { code: 1, version: 1 }, unique: true }
    ]
  },

  // ==========================================
  // 9. AUD (Audit) - 2 collections
  // ==========================================
  aud_events: {
    name: 'aud_events',
    module: 'aud',
    description: 'Tamper-evident append-only audit trail with SHA-256 hash chaining (8-year retention)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['actorId', 'action', 'resource', 'at', 'hash', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          actorId: { bsonType: 'objectId' },
          action: { bsonType: 'string' },
          resource: {
            bsonType: 'object',
            required: ['type', 'id'],
            properties: {
              type: { bsonType: 'string' },
              id: { bsonType: 'objectId' }
            }
          },
          ip: { bsonType: ['string', 'null'] },
          userAgent: { bsonType: ['string', 'null'] },
          at: { bsonType: 'date' },
          prevHash: { bsonType: ['string', 'null'] },
          hash: { bsonType: 'string', description: 'sha256(prevHash + body)' }
        }
      }
    },
    indexes: [
      { name: 'ix_aud_events_actorId_at', key: { actorId: 1, at: -1 } },
      { name: 'ix_aud_events_resource', key: { 'resource.type': 1, 'resource.id': 1 } },
      { name: 'ix_aud_events_at', key: { at: -1 } }
    ]
  },

  aud_access_logs: {
    name: 'aud_access_logs',
    module: 'aud',
    description: 'Break-glass emergency clinical access records with alerts',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['actorId', 'patientId', 'reason', 'accessedAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          actorId: { bsonType: 'objectId' },
          patientId: { bsonType: 'objectId' },
          reason: { bsonType: 'string' },
          accessedAt: { bsonType: 'date' },
          ip: { bsonType: ['string', 'null'] },
          reviewedByCompliance: { bsonType: ['bool', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_aud_access_logs_patientId_accessedAt', key: { patientId: 1, accessedAt: -1 } },
      { name: 'ix_aud_access_logs_actorId', key: { actorId: 1 } }
    ]
  },

  // ==========================================
  // 10. RPT (Reports) - 3 collections
  // ==========================================
  rpt_templates: {
    name: 'rpt_templates',
    module: 'rpt',
    description: 'Report definitions, supported export formats, and field schemas',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['type', 'name', 'supportedFormats', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          type: { bsonType: 'string' }, // e.g. payments-workbook, reconciliation, patient-care
          name: { bsonType: 'string' },
          supportedFormats: {
            bsonType: 'array',
            items: { bsonType: 'string', enum: ['pdf', 'xlsx'] }
          },
          periodic: { bsonType: 'bool' }
        }
      }
    },
    indexes: [
      { name: 'ux_rpt_templates_type', key: { type: 1 }, unique: true }
    ]
  },

  rpt_jobs: {
    name: 'rpt_jobs',
    module: 'rpt',
    description: 'Report generation execution queue with signed download URLs and 30-day TTL',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['reportType', 'format', 'requestedBy', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          reportType: { bsonType: 'string' },
          format: { bsonType: 'string', enum: ['pdf', 'xlsx'] },
          filters: { bsonType: 'object' },
          requestedBy: { bsonType: 'objectId' },
          status: { bsonType: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
          fileUrl: { bsonType: ['string', 'null'] },
          fileSize: { bsonType: ['int', 'null'] },
          expiresAt: { bsonType: ['date', 'null'] },
          error: { bsonType: ['string', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_rpt_jobs_requestedBy_createdAt', key: { requestedBy: 1, createdAt: -1 } },
      { name: 'ix_rpt_jobs_expiresAt', key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      { name: 'ix_rpt_jobs_status', key: { status: 1 } }
    ]
  },

  rpt_schedules: {
    name: 'rpt_schedules',
    module: 'rpt',
    description: 'Automated recurring report schedule packs (daily finance pack, discharge)',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['reportType', 'format', 'cronExpression', 'recipients', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          reportType: { bsonType: 'string' },
          format: { bsonType: 'string', enum: ['pdf', 'xlsx'] },
          cronExpression: { bsonType: 'string' },
          recipients: {
            bsonType: 'array',
            items: { bsonType: 'string' }
          },
          status: { bsonType: 'string', enum: ['active', 'paused'] },
          lastRunAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_rpt_schedules_status', key: { status: 1 } }
    ]
  },

  // ==========================================
  // 11. NTF (Notifications) - 3 collections
  // ==========================================
  ntf_templates: {
    name: 'ntf_templates',
    module: 'ntf',
    description: 'SMS, WhatsApp and Email templates with DLT registration identifiers',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['key', 'channel', 'content', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          key: { bsonType: 'string' },
          channel: { bsonType: 'string', enum: ['sms', 'whatsapp', 'email', 'push'] },
          dltTemplateId: { bsonType: ['string', 'null'] },
          subject: { bsonType: ['string', 'null'] },
          content: { bsonType: 'string' }
        }
      }
    },
    indexes: [
      { name: 'ux_ntf_templates_key_channel', key: { key: 1, channel: 1 }, unique: true }
    ]
  },

  ntf_messages: {
    name: 'ntf_messages',
    module: 'ntf',
    description: 'Outbound dispatched notifications, delivery status and gateway reference',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'channel', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          channel: { bsonType: 'string', enum: ['sms', 'whatsapp', 'email', 'push'] },
          recipient: { bsonType: ['string', 'null'] },
          content: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string', enum: ['queued', 'sent', 'delivered', 'failed'] },
          gatewayRef: { bsonType: ['string', 'null'] },
          sentAt: { bsonType: ['date', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ix_ntf_messages_userId_createdAt', key: { userId: 1, createdAt: -1 } },
      { name: 'ix_ntf_messages_status', key: { status: 1 } }
    ]
  },

  ntf_preferences: {
    name: 'ntf_preferences',
    module: 'ntf',
    description: 'User notification opt-ins and channel preferences',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'sms', 'email', 'whatsapp', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          userId: { bsonType: 'objectId' },
          sms: { bsonType: 'bool' },
          email: { bsonType: 'bool' },
          whatsapp: { bsonType: 'bool' },
          push: { bsonType: ['bool', 'null'] }
        }
      }
    },
    indexes: [
      { name: 'ux_ntf_preferences_userId', key: { userId: 1 }, unique: true }
    ]
  },

  // ==========================================
  // 12. SYS (Platform System) - 4 collections
  // ==========================================
  sys_counters: {
    name: 'sys_counters',
    module: 'sys',
    description: 'Gapless sequence counters for invoice and order numbers per financial year',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['seqKey', 'currentVal', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          seqKey: { bsonType: 'string' }, // e.g. "invoice_2026-27"
          currentVal: { bsonType: 'int', minimum: 0 }
        }
      }
    },
    indexes: [
      { name: 'ux_sys_counters_seqKey', key: { seqKey: 1 }, unique: true }
    ]
  },

  sys_feature_flags: {
    name: 'sys_feature_flags',
    module: 'sys',
    description: 'Dynamic feature flags and rollout percentages',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['key', 'enabled', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          key: { bsonType: 'string' },
          description: { bsonType: ['string', 'null'] },
          enabled: { bsonType: 'bool' },
          rolloutPercentage: { bsonType: ['int', 'null'], minimum: 0, maximum: 100 }
        }
      }
    },
    indexes: [
      { name: 'ux_sys_feature_flags_key', key: { key: 1 }, unique: true }
    ]
  },

  sys_idempotency_keys: {
    name: 'sys_idempotency_keys',
    module: 'sys',
    description: 'Write request idempotency tracker caching response payloads for replays',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['key', 'endpoint', 'status', 'expiresAt', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          key: { bsonType: 'string' },
          endpoint: { bsonType: 'string' },
          status: { bsonType: 'string', enum: ['in_flight', 'completed'] },
          responseStatusCode: { bsonType: ['int', 'null'] },
          responseBody: { bsonType: ['object', 'null'] },
          expiresAt: { bsonType: 'date' }
        }
      }
    },
    indexes: [
      { name: 'ux_sys_idempotency_keys_key', key: { key: 1 }, unique: true },
      { name: 'ix_sys_idempotency_keys_expiresAt', key: { expiresAt: 1 }, expireAfterSeconds: 0 }
    ]
  },

  sys_outbox: {
    name: 'sys_outbox',
    module: 'sys',
    description: 'Transactional outbox for reliable Cloud Tasks / Pub/Sub dispatch',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['topic', 'payload', 'status', 'schemaVersion', 'createdAt', 'updatedAt'],
        properties: {
          ...baseProperties,
          topic: { bsonType: 'string' },
          payload: { bsonType: 'object' },
          status: { bsonType: 'string', enum: ['pending', 'published', 'failed'] },
          publishedAt: { bsonType: ['date', 'null'] },
          retryCount: { bsonType: ['int', 'null'], minimum: 0 }
        }
      }
    },
    indexes: [
      { name: 'ix_sys_outbox_status_createdAt', key: { status: 1, createdAt: 1 } }
    ]
  }
};
