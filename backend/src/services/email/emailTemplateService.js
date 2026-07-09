import { StatusCodes } from 'http-status-codes'
import ApiError from '../../utils/ApiError.js'
import { emailTemplates } from './templates/index.js'

// Render template theo key (purpose) + data. Throw nếu template không tồn tại.
const render = (template, data = {}) => {
  const builder = emailTemplates[template]

  if (!builder) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Email template không hợp lệ: ${template}`,
    )
  }

  return builder(data)
}

export const emailTemplateService = {
  render,
}
