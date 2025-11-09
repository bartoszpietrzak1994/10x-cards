import { AIGenerationForm } from "@/components/AIGenerationForm";
import { StatusBanner } from "@/components/StatusBanner";
import { AIGenerationMeta } from "@/components/AIGenerationMeta";
import { ProposalsList } from "@/components/ProposalsList";
import { useAIGeneration } from "@/components/hooks/useAIGeneration";

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

export default function AIGenerationView() {
  const { vm, setInputText, submit, refresh, accept, startEdit, updateEdit, saveEdit, cancelEdit, remove } =
    useAIGeneration();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Flashcards Generation</h1>
          <p className="text-muted-foreground">Paste your long-form text and let AI generate flashcards for you.</p>
        </div>

        <div className="space-y-6">
          <AIGenerationForm
            value={vm.inputText}
            onChange={setInputText}
            isValid={vm.isValidLength}
            min={MIN_CHARS}
            max={MAX_CHARS}
            onSubmit={submit}
            isSubmitting={vm.isSubmitting}
          />

          {vm.error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{vm.error}</div>}

          <StatusBanner status={vm.status} />

          {(vm.generationMeta || vm.aiLog) && (
            <AIGenerationMeta log={vm.aiLog} generationMeta={vm.generationMeta} onRefresh={refresh} />
          )}

          {vm.status !== "idle" && (
            <ProposalsList
              proposals={vm.proposals}
              onAccept={accept}
              onEditStart={startEdit}
              onEditSave={saveEdit}
              onEditCancel={cancelEdit}
              onDelete={remove}
              onEditChange={updateEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
