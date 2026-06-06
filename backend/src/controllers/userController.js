import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { userService } from '../services/userService.js'

// [Admin] Lấy danh sách tài khoản 
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query)

  res.status(StatusCodes.OK).json({
    message: 'Get users successfully',
    data: result,
  })
})

// [Admin] Lấy chi tiết 1 tài khoản.
export const getUserById = asyncHandler(async (req, res) => {
  const result = await userService.getUserById(req.params.userId)

  res.status(StatusCodes.OK).json({
    message: 'Get user detail successfully',
    data: result,
  })
})

// [Admin] Tạo tài khoản mới.
export const createUser = asyncHandler(async (req, res) => {
  const result = await userService.createUser(req.body)

  res.status(StatusCodes.CREATED).json({
    message: 'User created successfully',
    data: result,
  })
})

// [Admin] Cập nhật tài khoản.
export const updateUser = asyncHandler(async (req, res) => {
  const result = await userService.updateUser(req.params.userId, req.body)

  res.status(StatusCodes.OK).json({
    message: 'User updated successfully',
    data: result,
  })
})

// [Admin] Xóa tài khoản.
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.userId, req.user._id)

  res.status(StatusCodes.OK).json({
    message: 'User deleted successfully',
    data: result,
  })
})
