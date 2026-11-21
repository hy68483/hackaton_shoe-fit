# Database ER diagram

Verified against the SQLAlchemy models and the deployed PostgreSQL schema on
2026-11-21. The diagram shows relationships enforced by database foreign keys.

```mermaid
erDiagram
    USERS ||--o{ CONSENTS : grants
    USERS ||--o{ MEASUREMENTS : owns
    USERS ||--o| FOOT_PROFILES : has
    CONSENTS ||--o{ MEASUREMENTS : authorizes
    MEASUREMENTS ||--o{ MEASUREMENT_IMAGES : contains
    MEASUREMENTS ||--o| MEASUREMENT_RESULTS : produces
    BRANDS ||--o{ PRODUCTS : owns
    PRODUCTS ||--o{ PRODUCT_SIZES : offers

    USERS {
        uuid id PK
        varchar login_id UK
        varchar email UK "nullable"
        varchar password_hash
        varchar name
        varchar role
        timestamptz created_at
    }

    CONSENTS {
        uuid id PK
        uuid user_id FK
        boolean measurement_data
        boolean image_storage
        varchar policy_version
        timestamptz agreed_at
        timestamptz revoked_at "nullable"
    }

    MEASUREMENTS {
        uuid id PK
        uuid session_id UK
        uuid user_id FK
        uuid consent_id FK
        varchar status
        numeric confidence "nullable"
        timestamptz created_at
        timestamptz updated_at
        timestamptz discarded_at "nullable"
    }

    MEASUREMENT_IMAGES {
        uuid id PK
        uuid measurement_id FK
        varchar original_key
        varchar mask_key "nullable"
        varchar content_type
        integer file_size_bytes
        integer client_width
        integer client_height
        varchar device_orientation
        timestamptz created_at
    }

    MEASUREMENT_RESULTS {
        uuid id PK
        uuid measurement_id FK,UK
        numeric foot_length_mm
        numeric foot_width_mm
        varchar foot_side "nullable"
        numeric segmentation_confidence "nullable"
        timestamptz measured_at
        timestamptz created_at
        timestamptz updated_at
    }

    FOOT_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        numeric length_mm
        numeric width_mm
        varchar foot_side "nullable"
        numeric confidence "nullable"
        uuid measurement_id "nullable; no FK"
        timestamptz measured_at "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    BRANDS {
        uuid id PK
        varchar name UK
        timestamptz created_at
    }

    PRODUCTS {
        uuid id PK
        uuid brand_id FK
        varchar name
        varchar model_code
        varchar data_status
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_SIZES {
        uuid id PK
        uuid product_id FK
        varchar size
        numeric length_mm
        numeric width_mm
        varchar material "nullable"
        varchar fit_type "nullable"
        varchar source "nullable"
        date measured_at "nullable"
        timestamptz created_at
        timestamptz updated_at
    }
```

## Relationship rules

| Parent | Child | Cardinality | Delete behavior |
|---|---|---|---|
| `users` | `consents` | 1:N | User deletion cascades |
| `users` | `measurements` | 1:N | User deletion cascades |
| `users` | `foot_profiles` | 1:0..1 | User deletion cascades |
| `consents` | `measurements` | 1:N | Referenced consent deletion is restricted |
| `measurements` | `measurement_images` | 1:N | Measurement deletion cascades |
| `measurements` | `measurement_results` | 1:0..1 | Measurement deletion cascades |
| `brands` | `products` | 1:N | Brand deletion cascades |
| `products` | `product_sizes` | 1:N | Product deletion cascades |

`products` is unique by `(brand_id, model_code)`, and `product_sizes` is unique
by `(product_id, size)`.

## Schema observations

- `foot_profiles.measurement_id` stores a logical reference but has no foreign
  key, so PostgreSQL does not prevent an unknown or deleted measurement ID.
- The application initializes tables with SQLAlchemy `create_all`; there is no
  Alembic migration history. `create_all` does not safely evolve existing
  columns or constraints, so schema changes should introduce migrations.
- Status and role values are strings without database check constraints. Their
  accepted values are enforced only by application code.
- Wishlist, cart, order, payment, and inventory entities do not exist in the
  current database schema.
- At verification time, the deployed database contained two users and no rows
  in the other eight tables.
