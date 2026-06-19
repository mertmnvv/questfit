import { useUserStore } from '../store/userStore';
import { getColors } from '../theme';

export const useThemeColors = () => {
  const theme = useUserStore(state => state.appTheme);
  return getColors(theme);
};
