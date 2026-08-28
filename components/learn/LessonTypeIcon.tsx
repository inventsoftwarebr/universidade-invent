import {
  ClipboardList,
  FileText,
  PlayCircle,
  Radio,
  Upload,
  type LucideIcon,
} from "lucide-react";

const ICON_BY_TYPE: Record<string, LucideIcon> = {
  video: PlayCircle,
  text: FileText,
  quiz: ClipboardList,
  assignment: Upload,
  live: Radio,
};

const LABEL_BY_TYPE: Record<string, string> = {
  video: "Vídeo",
  text: "Leitura",
  quiz: "Quiz",
  assignment: "Atividade",
  live: "Ao vivo",
};

export function lessonTypeLabel(type: string): string {
  return LABEL_BY_TYPE[type] ?? "Aula";
}

export function LessonTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = ICON_BY_TYPE[type] ?? FileText;
  return (
    <Icon className={className} aria-label={lessonTypeLabel(type)} role="img" />
  );
}
