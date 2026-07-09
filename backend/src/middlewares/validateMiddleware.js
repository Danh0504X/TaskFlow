import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'

/**
 * Validate req[source] (body/query/params) bằng Zod schema trước khi vào controller.
 * Pass -> gán lại giá trị đã parse (đã ép kiểu, đã strip field lạ) vào req[source].
 * Fail -> ném ApiError 422 kèm danh sách lỗi từng field, không lộ chi tiết kỹ thuật.
 *
 * Lưu ý Express 5: req.query chỉ là getter (không có setter) nên phải override bằng
 * Object.defineProperty, gán trực tiếp req.query = ... sẽ throw TypeError.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }))

    const message = errors.map((e) => `${e.field}: ${e.message}`).join('; ')
    const error = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message)
    error.errors = errors
    return next(error)
  }

  if (source === 'query') {
    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    })
  } else {
    req[source] = result.data
  }

  next()
}
