# 데이터베이스 ERD

2026년 11월 21일 기준 SQLAlchemy 모델과 AWS에 배포된 PostgreSQL의 실제
스키마를 대조해 작성했습니다. 아래 ERD에는 데이터베이스 외래키로 강제되는
관계만 표시했습니다.

```mermaid
erDiagram
    USERS ||--o{ CONSENTS : 동의
    USERS ||--o{ MEASUREMENTS : 측정
    USERS ||--o| FOOT_PROFILES : 프로필
    CONSENTS ||--o{ MEASUREMENTS : 허용
    MEASUREMENTS ||--o{ MEASUREMENT_IMAGES : 이미지
    MEASUREMENTS ||--o| MEASUREMENT_RESULTS : 결과
    BRANDS ||--o{ PRODUCTS : 상품
    PRODUCTS ||--o{ PRODUCT_SIZES : 사이즈

    USERS {
        uuid id PK
        varchar login_id UK
        varchar email UK "NULL 허용"
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
        timestamptz revoked_at "NULL 허용"
    }

    MEASUREMENTS {
        uuid id PK
        uuid session_id UK
        uuid user_id FK
        uuid consent_id FK
        varchar status
        numeric confidence "NULL 허용"
        timestamptz created_at
        timestamptz updated_at
        timestamptz discarded_at "NULL 허용"
    }

    MEASUREMENT_IMAGES {
        uuid id PK
        uuid measurement_id FK
        varchar original_key
        varchar mask_key "NULL 허용"
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
        varchar foot_side "NULL 허용"
        numeric segmentation_confidence "NULL 허용"
        timestamptz measured_at
        timestamptz created_at
        timestamptz updated_at
    }

    FOOT_PROFILES {
        uuid id PK
        uuid user_id FK,UK
        numeric length_mm
        numeric width_mm
        varchar foot_side "NULL 허용"
        numeric confidence "NULL 허용"
        uuid measurement_id "NULL 허용, FK 아님"
        timestamptz measured_at "NULL 허용"
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
        varchar material "NULL 허용"
        varchar fit_type "NULL 허용"
        varchar source "NULL 허용"
        date measured_at "NULL 허용"
        timestamptz created_at
        timestamptz updated_at
    }
```

- `PK`: 기본키
- `FK`: 외래키
- `UK`: 유일키

## 관계 및 삭제 규칙

| 부모 테이블 | 자식 테이블 | 관계 | 삭제 규칙 |
|---|---|---|---|
| `users` | `consents` | 1:N | 사용자 삭제 시 함께 삭제 |
| `users` | `measurements` | 1:N | 사용자 삭제 시 함께 삭제 |
| `users` | `foot_profiles` | 1:0..1 | 사용자 삭제 시 함께 삭제 |
| `consents` | `measurements` | 1:N | 참조 중인 동의 정보는 삭제 제한 |
| `measurements` | `measurement_images` | 1:N | 측정 삭제 시 함께 삭제 |
| `measurements` | `measurement_results` | 1:0..1 | 측정 삭제 시 함께 삭제 |
| `brands` | `products` | 1:N | 브랜드 삭제 시 함께 삭제 |
| `products` | `product_sizes` | 1:N | 상품 삭제 시 함께 삭제 |

`products`는 `(brand_id, model_code)` 조합이 유일하고, `product_sizes`는
`(product_id, size)` 조합이 유일합니다.

## 확인된 구조상 주의점

- `foot_profiles.measurement_id`는 측정 ID를 저장하지만 외래키가 아닙니다.
  따라서 존재하지 않거나 삭제된 측정 ID가 저장되는 것을 PostgreSQL이
  차단하지 못합니다.
- 애플리케이션은 SQLAlchemy의 `create_all`로 테이블을 초기화하며 Alembic
  마이그레이션 이력이 없습니다. `create_all`은 기존 컬럼이나 제약조건의
  변경을 안전하게 반영하지 못하므로 스키마 변경 전에 마이그레이션 도입이
  필요합니다.
- 상태와 사용자 역할은 데이터베이스 체크 제약조건이 없는 문자열입니다.
  허용값은 애플리케이션 코드에서만 검증합니다.
- 현재 스키마에는 위시리스트, 장바구니, 주문, 결제, 재고 테이블이 없습니다.
- 확인 당시 배포 DB에는 사용자 2명만 존재하며 나머지 8개 테이블은
  비어 있었습니다.
