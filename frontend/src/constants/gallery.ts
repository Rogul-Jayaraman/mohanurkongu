import { Category } from '@/types/gallery';
import type { GalleryItem } from '@/types/gallery';

export const GALLERY_IMAGES: GalleryItem[] = [
    // Google Public Images
    { id: 'g1', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCXGk07MR_Z2rAJJKChns_UHvHdZneDCaKPSfcRR1StDAJIpea-DZvMqPkiGGiO1MBbgy8ZpRwVxZ_q90saAkUMVjtuDVwKeN8gJsWZJjQbb_FJnmFOCpODWlxo7_h2KFIuS84djNcbYBdt-mvxRROVmZgGSPlRJHNvMu6WEAahRb1XTzxon8ICq2DtAOX7HU8qJFQQo8ePQRPfql0a4G2i9skE75yMlYL41v5HI6O0N25fzj44ZHaXm_FlPbXuqZkG4WBY2fRaG8", category: Category.WEDDINGS },
    { id: 'g2', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB0NmMTr52vNhrnE7URGknVVs3qSNOwITi5UfxySDl2nPzOkVrYNQ0M9T-t0-E4eZW6I1uaNKQTbcalBAGQQlHUrJoI0H4a26CuK3dp7rGWWVn2_TwF4pTOblSjkMofj5pnHYxf79k7LsEGlOSGjCctHNKNndpTr8Nu1Z869DMntf1RXKAcq4a3DabvbhYzi9GWIhazLmvjAu3U2xoaI1oIHkMr0YfGKrW0_P94WxjA5yVfrmo01GLMBqmRETC0mZ0kuwmFfn33HM8", category: Category.STAGE_DECORATION },
    { id: 'g3', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBv3JdDO7__A6OHHdLO9dGHOOS7dCZweJBrieimommk0tMJP-ZKBa-SNZkjLls4EPPEzd_kHFWglbdtvBeumTpTksC8OW71YaAWq__DXtSmieMQmU92aPmdk6cD4FU8LZcLU9EVDkb4MRKtTlRjPaqVG4BbMxuUVwE0A_rz3UDNriv0iGbAcTuZBwy-_o1G6VBv26CeHZU9d3LtLmhkkevx-j-sEKtpJm5x0cxj3fD3XhevOpdz5aDVbXILLSAHUPPVOgahr_M9jIw", category: Category.DINING_AREA },
    { id: 'g4', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTtKLZM5v7_Us9wdj0-ll5sBESlqZIMWWmJo2cZ_W-Tvaz6BY3MsnesupHwPFv9V65ORkqMWcceCsfFo5vJrB9TTbq69O7Zrxy-JGqxudcOvkpznBsxFodkcdI1QqOonUIebxkV975HBPqv_UNBdEg8HomEZjNCTi5RtYX7IyuIsUxb9LDjtAvz3jeXYkfC8RKCeDHsaifpS1gBZmp5Tc18rbv7nR9RFoXoyY1IyTg8CNYhdF3qxWk2Ah8A_0eZ6tqDFuwfgkrXDs", category: Category.STAGE_DECORATION },
    { id: 'g5', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLY3XGm2JLKvbDSyziRke6auske8e-Z1vOelxOUlVkfjIqHnxDPm_5RFsH92Xcbknd7OHmBCcFp2XR26CjIWHgFwuh0Y1IIKg2IZdeAPVW0L1BoWGjM6BmXOJbUguExAz15Dtr5-4qX2VxgSfHYQbIp1FBsr5EGdP02GMRD3MW8NBu-BlXWV3EKoQ6xXpbrjtqtupnZw_PqstBJgP7SbZduqFYCuhW3JkXVcgDinsb4yS6S9IP-v_jwOyvfvBIcoVQjR9mGHnFQ1w", category: Category.VENUE_EXTERIOR },
    { id: 'g6', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC37Q5iRAl1WzVU2S78ZKjciWGPp8u7RwQXkXPYw1FL5s7-al2lpv5z29o6uvLGbF1DIr9EnB22NqgTbgTgizhN3UjfBhR_HMShP7mp7Xw0Ol9Rsx3ZTj6Z5oMPbN3KCBWLQMvFweUAYs3i6O9lrxXk2e34HD7e8An-Ubwm6Db9l5qHB72cKMJqJbRd2ZwZbyQQZUAX0zdgRAMlFj2Q4WS6-rK102PW0DWjc1PxByV-a2TN5dybqcePrLxCQC5efWnSKDRQ2JUZJVk", category: Category.STAGE_DECORATION },
    { id: 'g7', url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTPCaoxRrkHDP24fmsUea405EMZiWPetcER2l7DJis7ahTfQnU8nfKQ7XTj-IPicN7pSgq09DDL9dea8ySGwqBp3TcLt56NGlRHmGxtrPierxMOod8I6IgsFV_qY9w6XAfqToGlxoHVcXp1Qu-GifY2PseQchsiKEpHCOw6nfsw6ql-96Q3VAmlWoV80n-Cc5ZwKNAQEHmDocSBVm4197dAxIg-yxVtnheLZ6XCqZ5GKdsXkF5H9h8XNtc5IU_PrkXsftkZ4k6-mQ", category: Category.WEDDINGS },

    // Pinterest Curation
    { id: 'p1', url: "https://i.pinimg.com/736x/e3/16/14/e31614633058f51485a101ef377c6239.jpg", category: Category.WEDDINGS },
    { id: 'p2', url: "https://i.pinimg.com/736x/92/bc/17/92bc176e5dc5daaa4de3c2153e52d546.jpg", category: Category.WEDDINGS },
    { id: 'p3', url: "https://i.pinimg.com/736x/5c/60/80/5c60802b878edd9956866f51cfd4c471.jpg", category: Category.STAGE_DECORATION },
    { id: 'p4', url: "https://i.pinimg.com/736x/33/68/16/3368166c94366aabc7aef0baf03a1765.jpg", category: Category.RECEPTIONS },
    { id: 'p5', url: "https://i.pinimg.com/1200x/11/30/cc/1130cc02237f08c6d673d673a5756fe0.jpg", category: Category.WEDDINGS },
    { id: 'p6', url: "https://i.pinimg.com/736x/b9/53/66/b9536691b4ccdd3cd11a751e7433466d.jpg", category: Category.STAGE_DECORATION },
    { id: 'p7', url: "https://i.pinimg.com/736x/de/69/42/de69427c43d5b0004fab6f4fc2dc9f2c.jpg", category: Category.RECEPTIONS },
    { id: 'p8', url: "https://i.pinimg.com/736x/a5/f0/30/a5f0309258a5602c4c0938cec6cc1934.jpg", category: Category.VENUE_EXTERIOR },
    { id: 'p9', url: "https://i.pinimg.com/736x/3b/48/8a/3b488a850eab2cdee515808fabfb567d.jpg", category: Category.DINING_AREA },
    { id: 'p10', url: "https://i.pinimg.com/1200x/ed/eb/07/edeb0792d6bea05b806dc49fb32f0083.jpg", category: Category.WEDDINGS },
    { id: 'p11', url: "https://i.pinimg.com/1200x/90/35/71/90357170412fa8b7941e90d424fe1a6e.jpg", category: Category.STAGE_DECORATION },
    { id: 'p12', url: "https://i.pinimg.com/736x/10/8f/73/108f739d53c7f58bbb71d0118ea91442.jpg", category: Category.STAGE_DECORATION },
    { id: 'p13', url: "https://i.pinimg.com/736x/44/e1/78/44e17838a3edd5c883ab63ee3eeb1b7b.jpg", category: Category.VENUE_EXTERIOR },
    { id: 'p14', url: "https://i.pinimg.com/736x/39/d5/bf/39d5bf0a4728311cc7b7d98bfe7a1653.jpg", category: Category.DINING_AREA },
    { id: 'p15', url: "https://i.pinimg.com/1200x/6d/3c/e5/6d3ce5a2ff591b1b4f61b7ab4b3feca5.jpg", category: Category.RECEPTIONS },
    { id: 'p16', url: "https://i.pinimg.com/1200x/77/e3/c1/77e3c18e7a53aa9e44483c88f668b430.jpg", category: Category.VENUE_EXTERIOR },
    { id: 'p17', url: "https://i.pinimg.com/1200x/fc/02/6c/fc026c701369ec1a7bb59d26d6e27568.jpg", category: Category.VENUE_EXTERIOR },
];

export interface GridDefinition {
    id: string;
    columns: number;
    rows: number;
    areas: string[];
}

export const MATRIX_GRIDS: GridDefinition[] = [
    {
        id: 'grid1',
        columns: 4,
        rows: 4,
        areas: [
            "a a s7 s8",
            "a a s9 s10",
            "s1 s2 b b",
            "s3 s4 b b",
        ],
    },
    {
        id: 'grid2',
        columns: 4,
        rows: 5,
        areas: [
            "s1 s2 a a",
            "b b a a",
            "b b s5 s6",
            "s3 s4 c c",
            "s7 s8 c c",
        ],
    },
    {
        id: 'grid3',
        columns: 4,
        rows: 5,
        areas: [
            "b b s1 s2",
            "b b a a",
            "s7 s8 a a",
            "c c s3 s4",
            "c c s5 s6",
        ],
    },
    {
        id: 'grid4',
        columns: 4,
        rows: 5,
        areas: [
            "a a s3 s4",
            "a a s5 s6",
            "s1 s2 c c",
            "b b c c",
            "b b s7 s8",
        ],
    },
    {
        id: 'grid5',
        columns: 4,
        rows: 5,
        areas: [
            "s7 a a a",
            "s6 a a a",
            "s13 s5 s4 s3",
            "b b b s2",
            "b b b s1",
        ],
    },
    {
        id: 'grid6',
        columns: 4,
        rows: 4,
        areas: [
            "s8 s10 s11 s12",
            "s6 a a s1",
            "s7 a a s3",
            "s4 s5 s13 s2",
        ],
    },
    {
        id: 'grid7',
        columns: 4,
        rows: 5,
        areas: [
            "a a s6 s5",
            "a a s1 s2",
            "c c s4 s3",
            "c c b b",
            "s7 s8 b b",
        ],
    },
];
