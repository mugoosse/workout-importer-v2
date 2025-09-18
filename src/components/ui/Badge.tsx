import { Text, View } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const baseClasses = 'px-2 py-1 rounded-md';
  const variantClasses = variant === 'outline'
    ? 'border border-gray-600 bg-transparent'
    : 'bg-[#6F2DBD]';

  return (
    <View className={`${baseClasses} ${variantClasses} ${className}`}>
      <Text className="text-white text-xs font-Poppins_500Medium">
        {children}
      </Text>
    </View>
  );
};