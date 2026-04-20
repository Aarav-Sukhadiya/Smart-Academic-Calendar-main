export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  className = '',
  children,
  ...rest
}) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  return (
    <Tag className={`${variants[variant] ?? variants.primary} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
