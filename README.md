<!-- "use client";
import { FileData, StatusStep } from "@/types/workspace";
import { useEffect, useRef, useState } from "react";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Code2, Eye } from "lucide-react";

// ─── Placeholder ──────────────────────────────────────────────────────────────
const PLACEHOLDER_FILES = {
  "/App.js": {
    code: `export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <p style={{ fontSize: 14 }}>Your app will appear here</p>
      </div>
    </div>
  );
}`,
  },
};

// ─── Base dependencies ────────────────────────────────────────────────────────

const BASE_DEPENDENCIES: Record<string, string> = {
  "react-is": "latest",
  "react-router-dom": "latest",
  "lucide-react": "latest",
  recharts: "latest",
  "date-fns": "latest",
  "framer-motion": "latest",
  "react-hook-form": "latest",
  "@hookform/resolvers": "latest",
  zod: "latest",
  "@radix-ui/react-dialog": "latest",
  "@radix-ui/react-dropdown-menu": "latest",
  "@radix-ui/react-tabs": "latest",
  "@radix-ui/react-tooltip": "latest",
  "@radix-ui/react-accordion": "latest",
  "@radix-ui/react-select": "latest",
  axios: "latest",
  clsx: "latest",
  "class-variance-authority": "latest",
  "tailwind-merge": "latest",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "preview" | "code";

interface CodePanelProps {
  fileData: FileData | null;
  isGenerating: boolean;
  statusLog: StatusStep[];
  onFilePatch: (patches: FileData) => void;
  //   onImprove: (userRequest: string) => Promise<void>;
  //   onFixError: (error: string) => Promise<void>;
  //   appTitle: string | null;
  //   isImproving: boolean;
  //   isProUser: boolean;
}


// ─── SandpackInner ────────────────────────────────────────────────────────────
// Lives inside SandpackProvider so it can call useSandpack().
// Receives fileData as a prop and uses updateFile() to push code changes
// into the live Sandpack instance without remounting the provider.
function SandpackInner({
  fileData,
  isGenerating,
  activeTab,
  setActiveTab
}: {
  fileData: FileData | null;
  isGenerating: boolean;
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  //TODO statusLog: onImprove onFixError
}) {
  const { sandpack, listen } = useSandpack();
  // TODO: listen imported from useSandpack for error detection

  // Push file updates into Sandpack without remounting
  // We use SandpackProvider's on the FIle PAth set only 
  // when file contents changes( after generation), we push them via updateFile()
  //so sandpack stays mounted and the  preview  refreses in place 

  const prevFileRef = useRef<Record<string, { code: string }>>({});
  useEffect(() => {
    if (!fileData?.files) return
    const prev = prevFileRef.current;

    for (const [path, { code }] of Object.entries(fileData.files)) {
      if (prev[path]?.code !== code) {
        sandpack.updateFile(path, code);
      }
    }
    //asign it 
    prevFileRef.current = fileData.files;
  }, [fileData?.files])


  //TODO  useEffect listen() for sandpack preview error 


  //TOdo aut-switch to preview tab when fileData first  arrives
  //useEffect  if(filedata) setactiveTab("previw")

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ActiveTab)}
      className="flex h-full gap-0 flex-col"
    >
      <div className="flex items-center justify-between border-b border-white/6 px-2">
        <TabsList
          variant="line"
          className="h-auto gap-0 rounded-none bg-transparent p-0"
        >
          <TabsTrigger
            value="code"
            className="border-b-2 pt-2"
          >
            <Code2 className="h-3.5 w-3.5" />
            Code
          </TabsTrigger>
          <TabsTrigger value="preview"
            className="border-b-2 pt-2"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
        </TabsList>
        {/* TOdo imporve with ai button pro/ starter pricing modal for free */}
        {/* TODO download zip button   */}
      </div>

      <SandpackLayout
        style={{
          height: 0,
          flex: 1,
          border: "none",
          borderRadius: 0,
          background: "transparent",
          overflow: "hidden"
        }}
      >
        <TabsContent value="preview"
          keepMounted
          className="m-0 h-full w-full p-0"
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            style={{ height: "100%" }}
          />
        </TabsContent>
        <TabsContent value="code"
          keepMounted
          className="m-0 h-full w-full flex p-0"
        >
          <SandpackFileExplorer
            style={{
              height: "100%",
              width: "180px",
              borderRight: "0.5px solid rgba(255,255,255,0.08)",
              flex: "0 0 auto"
            }}
          />
          <SandpackCodeEditor
            style={{
              height: "100%",
              flex: 1,
              overflow: "auto"
            }}
            showTabs
            showLineNumbers
            showInlineErrors
            closableTabs
            readOnly
          />
        </TabsContent>
      </SandpackLayout>
    </Tabs>
  )
}




export function CodePanel({
  fileData,
  isGenerating,
  statusLog,
  onFilePatch: _onFilePatch,

}: CodePanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");

  const files = fileData?.files ?? PLACEHOLDER_FILES;

  const dependencies = {
    ...BASE_DEPENDENCIES,
    ...(fileData?.dependencies ?? {}),
  };

  const filePathKey = Object.keys(files).sort().join("|");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SandpackProvider key={filePathKey}
        template="react"
        theme={dracula}
        files={files}
        customSetup={{ dependencies }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          recompileMode: "delayed",
          recompileDelay: 500,
        }}
      >
        <SandpackInner
          fileData={fileData}
          isGenerating={isGenerating}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </SandpackProvider>
    </div>
  )
} -->