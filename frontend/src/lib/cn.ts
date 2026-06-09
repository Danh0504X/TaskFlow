/**
 * Gộp các class name, bỏ qua giá trị falsy (false/undefined/null).
 * Giúp viết className có điều kiện gọn gàng:
 *   cn('px-4', isActive && 'bg-blue-500', disabled && 'opacity-50')
 */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')
