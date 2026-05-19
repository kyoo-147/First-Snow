export interface DomainSuccess<T> {
  ok: true;
  value: T;
}

export interface DomainFailure {
  ok: false;
  code:
    | "validation_error"
    | "authentication_error"
    | "authorization_error"
    | "provider_failure"
    | "dependency_unavailable"
    | "conflict_error"
    | "internal_error";
  message: string;
}

export type DomainResult<T> = DomainSuccess<T> | DomainFailure;
