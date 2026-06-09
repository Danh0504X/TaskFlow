import { QueryClient } from '@tanstack/react-query'

// Cấu hình mặc định dùng chung cho toàn app.
// Đặt ở đây 1 lần để mọi query/mutation có hành vi nhất quán.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dữ liệu được coi là "còn tươi" trong 30s -> không refetch thừa.
      staleTime: 30_000,
      // Lỗi mạng: thử lại tối đa 1 lần (tránh spam khi server lỗi thật).
      retry: 1,
      // Không tự refetch mỗi khi focus lại tab (gây gọi API liên tục).
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutation (tạo/sửa/xóa) không tự retry — để tránh thao tác lặp ngoài ý muốn.
      retry: 0,
    },
  },
})
