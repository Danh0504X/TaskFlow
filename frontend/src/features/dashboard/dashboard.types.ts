// Sprint đang ACTIVE, sắp tới endDate — dùng cho widget "Sprint sắp kết thúc" ở Dashboard.
// Khớp với response thật từ GET /me/upcoming-sprints (xem sprintService.getUpcomingSprints).
export interface UpcomingSprint {
  _id: string
  name: string
  projectId: string
  projectName: string
  endDate: string
}
