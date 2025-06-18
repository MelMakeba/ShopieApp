import { Injectable, HttpStatus } from '@nestjs/common';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class ApiResponseService {
  success<T>(data: T, message = 'Success', statusCode = HttpStatus.OK) {
    return {
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  error(
    message = 'Error',
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    error?: unknown,
  ) {
    return {
      statusCode,
      message,
      error: error || null,
      timestamp: new Date().toISOString(),
    };
  }

  paginate<T>(data: T[], meta: PaginationMeta, message = 'Success') {
    return {
      statusCode: HttpStatus.OK,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  ok<T>(data: T, message = 'Success') {
    return this.success(data, message, HttpStatus.OK);
  }

  created<T>(data: T, message = 'Created successfully') {
    return this.success(data, message, HttpStatus.CREATED);
  }

  badRequest(message = 'Bad request', error?: any) {
    return this.error(message, HttpStatus.BAD_REQUEST, error);
  }

  notFound(message = 'Not found', error?: any) {
    return this.error(message, HttpStatus.NOT_FOUND, error);
  }

  forbidden(message = 'Forbidden', error?: any) {
    return this.error(message, HttpStatus.FORBIDDEN, error);
  }

  unauthorized(message = 'Unauthorized', error?: any) {
    return this.error(message, HttpStatus.UNAUTHORIZED, error);
  }

  noContent() {
    return {
      statusCode: HttpStatus.NO_CONTENT,
      timestamp: new Date().toISOString(),
    };
  }
}
