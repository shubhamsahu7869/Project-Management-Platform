declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";
  type IconProps = SVGProps<SVGSVGElement> & { size?: string | number };
  export const Bell: ComponentType<IconProps>;
  export const FolderKanban: ComponentType<IconProps>;
  export const LayoutDashboard: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const Settings: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const CheckCircle2: ComponentType<IconProps>;
  export const ListTodo: ComponentType<IconProps>;
}
