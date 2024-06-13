export interface IBook {
    bookID: string;
    name: string;
    author: string;
    charges: number;
    issueCount: number;
    submitCount: number;
    publishedDate: Date;
    subscriptionDays:number;
    quantityAvailable: number;
    numberOfFreeDays: number;
    description: string;
    isActive: boolean;
}
