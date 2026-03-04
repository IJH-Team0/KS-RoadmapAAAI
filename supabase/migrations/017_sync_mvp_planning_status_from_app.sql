-- Eenmalige sync (Optie A): zet planning_status van MVP-features op app.status
-- waar planning_status nog niet gezet is (null of leeg), zodat Backlog/Planning kloppen met app-niveau.
-- Bij afgewezen app: feature blijft wensenlijst (zoals in 008).

UPDATE public.features f
SET planning_status = CASE
  WHEN a.status = 'afgewezen' THEN 'wensenlijst'::app_status
  ELSE a.status
END
FROM public.apps a
WHERE f.app_id = a.id
  AND f.naam = 'MVP'
  AND (f.planning_status IS NULL OR f.planning_status::text = '');
