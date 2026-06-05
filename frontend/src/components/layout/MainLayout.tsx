import { Outlet } from 'react-router-dom'

// Layout gốc cho các trang cần đăng nhập. Trang con render vào <Outlet />.
const MainLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}

export default MainLayout
