export type MessageRole = "user" | "assistant";

export interface Message{
    role: MessageRole;
    content:string;
    imageUrl?:string;
}

//files + dependencies alaways travel together as one unnit 
// this is what get saved to prisma as a single Json column
export interface FileData{
    files:Record<string,{code:string}>;
    dependencies:Record<string,string>;
    title?:string;
}

export interface StatusStep{
    label:string;
    status:"running" | "done";
}

export interface WorkspaceData{
    id:string;
    title:string | null;
    messages:unknown; // prisma return json - we parse it runtime
    fileData: unknown; // prisma return json - we parse it runtime
}

export interface WorkspaceUser{
    id:string;
    credits:number;
    plan:string;
}
