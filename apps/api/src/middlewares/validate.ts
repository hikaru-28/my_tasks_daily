import type { RequestHandler } from 'express'
import type { ZodTypeAny } from 'zod'
import { ValidationError } from '@/errors/app-error'

interface ValidateSchemas<
  TBody extends ZodTypeAny = ZodTypeAny,
  TQuery extends ZodTypeAny = ZodTypeAny,
  TParams extends ZodTypeAny = ZodTypeAny,
> {
  body?: TBody
  query?: TQuery
  params?: TParams
}

// Express 5 では req.query が getter 専用になり直接代入できない（req.body/req.params は可能）。
// body/query/params すべてを req.validated に格納する方式に統一し、この非対称性をルート層から隠す。
export function validate<
  TBody extends ZodTypeAny = ZodTypeAny,
  TQuery extends ZodTypeAny = ZodTypeAny,
  TParams extends ZodTypeAny = ZodTypeAny,
>(schemas: ValidateSchemas<TBody, TQuery, TParams>): RequestHandler {
  return (req, _res, next) => {
    let body: unknown
    let query: unknown
    let params: unknown

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body)
      if (!result.success) {
        throw new ValidationError('invalid request body', result.error.flatten())
      }
      body = result.data
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query)
      if (!result.success) {
        throw new ValidationError('invalid query parameters', result.error.flatten())
      }
      query = result.data
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params)
      if (!result.success) {
        throw new ValidationError('invalid path parameters', result.error.flatten())
      }
      params = result.data
    }

    req.validated = { body, query, params }
    next()
  }
}
