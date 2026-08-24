# Application Product Scope

The concise product source of truth is [`../../PRODUCT.md`](../../PRODUCT.md).

## Primary journeys

```text
Visitor -> sign up or log in -> membershipless onboarding
        -> create a school | redeem teacher invite | join as student
        -> selected school -> role-aware dashboard
```

```text
Teacher/Admin -> class -> create or import draft -> edit -> validate -> publish
              -> student attempt -> results -> grading/release
```

```text
Student -> join or request class -> assigned test -> exam cover -> live attempt
        -> submission -> result when released
```

## Stable business rules

- Signup creates a global account, not a global role.
- Roles and access derive from school memberships and class relationships.
- Teacher entry is administrator-controlled; student entry follows configured invite/join rules.
- The selected school is part of the authenticated context, not a client-authoritative filter.
- Marketing, public SEO pages, and platform-operator workflows are outside this repository.

Feature-specific rules, implementation paths, and known gaps live under [`../features/`](../features/).
Do not promote a dated planning item to a product requirement without maintainer confirmation.
