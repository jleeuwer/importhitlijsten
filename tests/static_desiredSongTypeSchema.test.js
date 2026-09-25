import { describe, expect, test } from "vitest";
import fs from "node:fs";

describe("2H-P desired song type schema and routes", () => {
  test("migratie voegt staging kolom en foreign key naar song_types toe", () => {
    const sql = fs.readFileSync("scripts/sql/20260426_sprint2h_p_desired_song_type.sql", "utf8");
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS hl_desired_song_type_key bigint/i);
    expect(sql).toMatch(/FOREIGN KEY \(hl_desired_song_type_key\)/i);
    expect(sql).toMatch(/REFERENCES public\.song_types\(st_song_type_key\)/i);
  });

  test("API biedt song_types aan en staging update valideert keys", () => {
    const routes = fs.readFileSync("routes/indexroutes.js", "utf8");
    expect(routes).toContain('/api/song-types');
    expect(routes).toContain('listSongTypes');
    expect(routes).toContain('songTypeExists');
    expect(routes).toContain('hl_desired_song_type_key');
  });
});
