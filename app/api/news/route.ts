import { NextRequest, NextResponse } from "next/server";
import { fetchNaverNews, type NewsSort } from "@/lib/utils";
import { fetchArticlePhoto } from "@/lib/unsplash";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("query") ?? "").trim();
  const sortParam = searchParams.get("sort") ?? "sim";
  const startParam = Number(searchParams.get("start") ?? "1");
  const displayParam = Number(searchParams.get("display") ?? "10");

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  const sort: NewsSort = sortParam === "date" ? "date" : "sim";
  const start = Number.isFinite(startParam) && startParam > 0 ? startParam : 1;
  const display =
    Number.isFinite(displayParam) && displayParam > 0
      ? Math.min(displayParam, 100)
      : 10;

  try {
    const { items, total } = await fetchNaverNews({
      query,
      sort,
      start,
      display,
    });

    const itemsWithPhotos = await Promise.all(
      items.map(async (item) => ({
        ...item,
        photo: await fetchArticlePhoto(item.categoryLabel, item.title),
      }))
    );

    return NextResponse.json({ items: itemsWithPhotos, total, start, display });
  } catch (error) {
    console.error("[/api/news] failed to fetch naver news", error);
    return NextResponse.json(
      { error: "뉴스를 불러오는 중 문제가 발생했어요." },
      { status: 502 }
    );
  }
}
