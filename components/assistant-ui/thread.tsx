import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAttachments, type PendingAttachment } from "@/lib/attachment-context";
import {
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PaperclipIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { type FC, useRef, useState } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
      style={{
        ["--thread-max-width" as string]: "44rem",
        ["--composer-radius" as string]: "24px",
        ["--composer-padding" as string]: "10px",
        ["--message-composer-gap" as string]: "12px",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <div className="mx-auto flex min-h-0 w-full max-w-(--thread-max-width) flex-1 flex-col justify-end">
          <ThreadPrimitive.Messages>
            {() => <ThreadMessage />}
          </ThreadPrimitive.Messages>
        </div>

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-(--composer-radius) bg-background pt-(--message-composer-gap) pb-8 md:pb-10">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <div className="aui-thread-welcome-message flex size-full flex-col justify-center px-4">
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
            Hello there!
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-xl delay-75 duration-200">
            How can I help you today?
          </p>
        </div>
      </div>
      <ThreadSuggestions />
    </div>
  );
};

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-2 pb-4">
      <ThreadPrimitive.Suggestions>
        {() => <ThreadSuggestionItem />}
      </ThreadPrimitive.Suggestions>
    </div>
  );
};

const ThreadSuggestionItem: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 @md:nth-[n+3]:block nth-[n+3]:hidden animate-in fill-mode-both duration-200">
      <SuggestionPrimitive.Trigger send asChild>
        <Button
          variant="ghost"
          className="aui-thread-welcome-suggestion h-auto w-full @md:flex-col flex-wrap items-start justify-start gap-1 rounded-3xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
        >
          <SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 font-medium" />
          <SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 text-muted-foreground empty:hidden" />
        </Button>
      </SuggestionPrimitive.Trigger>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Attachment chip shown in the composer before sending
// ---------------------------------------------------------------------------

const AttachmentChip: FC<{ att: PendingAttachment; onRemove: () => void }> = ({
  att,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs">
      <PaperclipIcon className="size-3 shrink-0 text-muted-foreground" />
      <span className="max-w-32 truncate">{att.filename}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-muted-foreground hover:text-foreground"
        aria-label={`Remove ${att.filename}`}
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composer with attachment support
// ---------------------------------------------------------------------------

const Composer: FC = () => {
  const { attachments, addAttachment, removeAttachment, clearAttachmentsUI } = useAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/files", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      addAttachment({
        file_id: data.file_id,
        filename: data.filename,
        content_type: file.type.startsWith("image/") ? "image" : "document",
      });
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ComposerPrimitive.Root
      className="aui-composer-root relative flex w-full flex-col"
      onSubmit={clearAttachmentsUI}
    >
      <div
        data-slot="composer-shell"
        className="flex w-full flex-col gap-2 rounded-(--composer-radius) border bg-background p-(--composer-padding) transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20"
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1 pt-0.5">
            {attachments.map((att) => (
              <AttachmentChip
                key={att.file_id}
                att={att}
                onRemove={() => removeAttachment(att.file_id)}
              />
            ))}
          </div>
        )}
        <ComposerPrimitive.Input
          placeholder="Send a message..."
          className="aui-composer-input max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
            />
            <TooltipIconButton
              tooltip={uploading ? "Uploading…" : "Attach file"}
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Attach file"
            >
              {uploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PaperclipIcon className="size-4" />
              )}
            </TooltipIconButton>
          </div>
          <ComposerAction onSend={clearAttachmentsUI} />
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC<{ onSend?: () => void }> = ({ onSend }) => {
  return (
    <div className="aui-composer-action-wrapper flex items-center gap-1">
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-send size-8 rounded-full"
            aria-label="Send message"
            onClick={onSend}
          >
            <ArrowUpIcon className="aui-composer-send-icon size-4" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel size-8 rounded-full"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};

// ---------------------------------------------------------------------------
// File download card — rendered when agent produces a file output
// ---------------------------------------------------------------------------

const FileDownloadCard: FC<{ input: Record<string, unknown> }> = ({ input }) => {
  const fileId = input.file_id as string;
  const filename = (input.filename as string | null) ?? "Download file";
  return (
    <a
      href={`/api/files/${fileId}/content`}
      download={filename}
      className="my-1 inline-flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
    >
      <DownloadIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="max-w-48 truncate">{filename}</span>
    </a>
  );
};

const FileAttachmentCard: FC<{ input: Record<string, unknown> }> = ({ input }) => {
  const filename = (input.filename as string | null) ?? "Attached file";
  return (
    <div className="mt-1.5 inline-flex items-center gap-2 rounded-lg border bg-background/60 px-2.5 py-1.5 text-xs text-foreground">
      <PaperclipIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="max-w-48 truncate">{filename}</span>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UserAttachmentChip: FC<{ attachment: any }> = ({ attachment }) => {
  const filename: string = attachment?.name ?? "Attachment";
  const contentType: string = attachment?.contentType ?? "";
  const isImage = attachment?.type === "image" || contentType.startsWith("image/");
  const subtitle = isImage ? "Image" : fileSubtitle(filename, contentType);

  return (
    <div className="flex max-w-[18rem] items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 shadow-sm">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
          isImage ? "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        }`}
      >
        <FileIconSmall isImage={isImage} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{filename}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
};

const FileIconSmall: FC<{ isImage: boolean }> = ({ isImage }) =>
  isImage ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

function fileSubtitle(filename: string, contentType: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop()!.toUpperCase() : "";
  if (ext) return ext;
  if (contentType) return contentType.split("/")[1]?.toUpperCase() ?? "File";
  return "File";
}

// ---------------------------------------------------------------------------
// Message error
// ---------------------------------------------------------------------------

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const ThinkingIndicator: FC = () => {
  return (
    <div className="flex items-center gap-2 py-1 text-muted-foreground text-sm">
      <span className="relative flex size-3 items-center justify-center">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-foreground opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-foreground" />
      </span>
      <span>Thinking…</span>
    </div>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-1 duration-150"
      data-role="assistant"
    >
      <div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
        <AuiIf
          condition={(s) =>
            s.message.status?.type === "running" &&
            !s.message.parts.some(
              (p) => p.type === "text" && p.text.length > 0,
            )
          }
        >
          <ThinkingIndicator />
        </AuiIf>
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === "text") return <MarkdownText />;
            if (part.type === "tool-call") {
              if (part.toolName === "__file_output__")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return <FileDownloadCard input={(part as any).input ?? (part as any).args ?? {}} />;
              return part.toolUI ?? <ToolFallback {...part} />;
            }
            return null;
          }}
        </MessagePrimitive.Parts>
        <MessageError />
      </div>

      <div className="aui-assistant-message-footer mt-1 ml-2 flex min-h-6 items-center">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-1 px-2 py-1 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <div className="aui-user-message-content-wrapper relative col-start-2 flex min-w-0 flex-col items-end gap-1.5">
        <AuiIf condition={(s) => !s.composer.isEditing}>
          <div className="aui-user-message-content wrap-break-word peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden">
            <MessagePrimitive.Parts />
          </div>
          <MessagePrimitive.Attachments>
            {({ attachment }) => <UserAttachmentChip attachment={attachment} />}
          </MessagePrimitive.Attachments>
          <div className="flex min-h-7 justify-end">
            <UserActionBar />
          </div>
        </AuiIf>
        <AuiIf condition={(s) => s.composer.isEditing}>
          <EditComposer />
        </AuiIf>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root -mr-1 flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-edit-composer-root flex w-full flex-col gap-2 rounded-2xl border bg-background p-3">
      <ComposerPrimitive.Input className="aui-edit-composer-input w-full resize-none bg-transparent text-sm outline-none" />
      <div className="flex justify-end gap-2">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button size="sm">Save</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
