using HelpDesk.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpDesk.API.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260622160000_FixInvalidInitialTicketStatus")]
public partial class FixInvalidInitialTicketStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DO $repair$
            DECLARE
                target_status_id integer;
                bad_status_id integer;
            BEGIN
                SELECT "StatusId"
                INTO target_status_id
                FROM "Statuses"
                WHERE lower(btrim("StatusName")) = 'open'
                ORDER BY "SortOrder", "StatusId"
                LIMIT 1;

                IF target_status_id IS NULL THEN
                    SELECT "StatusId"
                    INTO target_status_id
                    FROM "Statuses"
                    WHERE lower(btrim("StatusName")) = 'new'
                    ORDER BY "SortOrder", "StatusId"
                    LIMIT 1;
                END IF;

                IF target_status_id IS NULL THEN
                    SELECT "StatusId"
                    INTO bad_status_id
                    FROM "Statuses"
                    WHERE lower(btrim("StatusName")) = 'xw'
                    ORDER BY "SortOrder", "StatusId"
                    LIMIT 1;

                    IF bad_status_id IS NOT NULL THEN
                        UPDATE "Statuses"
                        SET "StatusName" = 'Open',
                            "Description" = 'Ticket has been created and is waiting for action'
                        WHERE "StatusId" = bad_status_id;

                        target_status_id := bad_status_id;
                    ELSE
                        SELECT "StatusId"
                        INTO target_status_id
                        FROM "Statuses"
                        WHERE lower(btrim("StatusName")) <> 'xw'
                        ORDER BY "SortOrder", "StatusId"
                        LIMIT 1;
                    END IF;
                END IF;

                IF target_status_id IS NOT NULL THEN
                    UPDATE "Tickets"
                    SET "StatusId" = target_status_id
                    WHERE "StatusId" IN (
                        SELECT "StatusId"
                        FROM "Statuses"
                        WHERE lower(btrim("StatusName")) = 'xw'
                          AND "StatusId" <> target_status_id
                    );

                    DELETE FROM "Statuses"
                    WHERE lower(btrim("StatusName")) = 'xw'
                      AND "StatusId" <> target_status_id;
                END IF;
            END
            $repair$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally does not recreate an invalid status or move tickets back to it.
    }
}
