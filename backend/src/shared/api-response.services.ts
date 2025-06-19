/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, HttpStatus } from '@nestjs/common';
import { ApiResponse } from './interfaces/api-response.interfaces';

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
    message: string,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorDetail?: string,
  ) {
    return {
      statusCode,
      message,
      error: errorDetail || message, // Ensure error is a string
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

  ok<T, R = any>(response: R, message: string, redirectUrl: string, data: T) {
    return this.success(data, message, HttpStatus.OK);
  }

  okRequestReset<T, R = any>(
    response: R,
    message: string,
    redirectUrl: string,
    data: T,
  ) {
    return this.success(data, message, HttpStatus.OK);
  }

  created<T>(data: T, message = 'Created successfully') {
    return this.success(data, message, HttpStatus.CREATED);
  }

  badRequest(message = 'Bad request', error?: any) {
    return this.error(message, HttpStatus.BAD_REQUEST, error);
  }

  notFound(message: string): ApiResponse<null> {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: message, // Ensure error is a string
      timestamp: new Date().toISOString(),
    };
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
