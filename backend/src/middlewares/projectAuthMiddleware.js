import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import Project from '../models/projects.js'

export const authorizeProjectRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId =
        req.params.projectId || req.body.projectId || req.query.projectId

      if (!projectId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Project id is required',
        })
      }

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Invalid project id',
        })
      }

      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message: 'Unauthorized',
        })
      }

      const project = await Project.findOne({
        _id: projectId,
        isDeleted: false,
      })

      if (!project) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Project not found',
        })
      }

      const member = project.members.find(
        (member) =>
          member.userId.toString() === req.user._id.toString() &&
          member.status === 'ACTIVE',
      )

      if (!member) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'You are not a member of this project',
        })
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'You do not have permission in this project',
        })
      }

      req.project = project
      req.projectRole = member.role
      req.projectMember = member

      next()
    } catch (error) {
      console.error('>> [authorizeProjectRole] Error:', error)

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error',
      })
    }
  }
}