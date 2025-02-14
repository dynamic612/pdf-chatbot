import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import {OpenAIEmbeddings} from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore} from "@langchain/pinecone";
import { Pinecone as PineconeClient} from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
dotenv.config();


export async function POST(req: NextRequest) {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;
    if(!file) {
        return NextRequest.json({success: false, error: "No file found"});
    }
    
    if(file.type !=="application/pdf") {
        return NextResponse.json({success: false, error: "Invalid file type"});
    }

    try {
        const loader = new PDFLoader(file);
        const docs = await loader.load();
        console.log('PDF loaded successfully.');

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const texts = await splitter.splitDocuments(docs);
        const pinecone = new Pinecone();

        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME as string);

        await PineconeStore.fromDocuments(texts, new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_KEY as string
        }), {
            pineconeIndex,
        });
        } catch (error) {
            console.log('Error processing PDF:', error);
        }

        
        return NextResponse.json({success: true});
    
}

