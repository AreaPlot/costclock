/* salary.ddl.sql
   Table definition for the Salary table.
   Source of the data for the Salary service.

   When applying to your own organization, you would place records
   within this table, or replace the table with a [materialized] view.

   Inspired from https://schema.org/EmployeeRole and JobPosting
*/

CREATE TABLE salary (
    salaryid SERIAL NOT NULL,
    name TEXT NOT NULL,
    basesalary NUMERIC NOT NULL,
--  salarycurrency TEXT,
    incentivecompensation NUMERIC,
    startdate DATE,
    enddate DATE,
    department TEXT,
    organization TEXT
);

COMMENT ON TABLE salary IS 'Salary: source of salary information';
COMMENT ON COLUMN salary.salaryid IS 'Unique identifier';
COMMENT ON COLUMN salary.name IS 'Name of the job or individual';
COMMENT ON COLUMN salary.basesalary IS 'The base salary of the job or of an employee';
COMMENT ON COLUMN salary.incentivecompensation IS 'Description of bonus and commission compensation aspects of the job';
COMMENT ON COLUMN salary.startdate IS 'Start date of the job or employee';
COMMENT ON COLUMN salary.enddate IS 'End date of the job or employee';
COMMENT ON COLUMN salary.department IS 'The closest in proximity grouping of jobs or employees (e.g. Accounts Payable).';
COMMENT ON COLUMN salary.organization IS 'The top level grouping of jobs or employees (e.g. Department of Treasury).';

/* Indexes, adjust for your data.
   Below are examples, some of which are PostgreSQL specific.
*/
CREATE INDEX idx_salary_name ON salary (name);
CREATE INDEX idx_salary_dept ON salary (department, name);
CREATE INDEX idx_salary_orgn ON salary (organization, department, name);

CREATE INDEX idx_salary_fts ON salary USING gin
    (setweight(to_tsvector('english'::regconfig, name), 'A') ||
    (setweight(to_tsvector('english'::regconfig, department), 'B') ||
    (setweight(to_tsvector('english'::regconfig, organization), 'C')
; -- or alternatively store the above in a new column (search_vector) and index that.


