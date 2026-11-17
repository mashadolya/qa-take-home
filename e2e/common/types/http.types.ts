/** HTTP methods the suite matches requests on. */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/** HTTP status codes the app returns (and the suite mocks). */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/** MIME types of the files the suite uploads. */
export enum MimeType {
  PNG = 'image/png',
}
