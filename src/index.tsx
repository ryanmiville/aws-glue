import { GetJobsCommand, GlueClient, Job, StartJobRunCommand, WorkerType } from "@aws-sdk/client-glue";
import { Action, ActionPanel, Form, Icon, List, Toast, showToast } from "@raycast/api";
import { useCachedPromise, useForm } from "@raycast/utils";
import AWSProfileDropdown from "./aws-profile-dropdown";

export default function Command() {
  const { data: jobs, error, isLoading, revalidate } = useCachedPromise(fetchJobs);
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter jobs by name..."
      searchBarAccessory={<AWSProfileDropdown onProfileSelected={revalidate} />}
    >
      {error ? (
        <List.EmptyView title={error.name} description={error.message} icon={Icon.Warning} />
      ) : (
        jobs?.map((job) => <GlueJob key={job.Name} job={job} />)
      )}
    </List>
  );
}

function GlueJob({ job }: { job: Job }) {
  return (
    <List.Item
      title={job.Name || ""}
      actions={
        <ActionPanel>
          <Action.Push title="Run Job" target={<RunJob job={job} />} />

          <Action.OpenInBrowser
            title="Open in Console"
            url={`https://us-east-1.console.aws.amazon.com/gluestudio/home?region=us-east-1#/editor/job/${job.Name}/runs`}
          />
          <Action.CopyToClipboard title="Copy Name" content={job.Name || ""} />
        </ActionPanel>
      }
    />
  );
}

const ARGS = `--arg1 value1
--arg2 value2
--arg3 value3`;

interface RunJobFormValues {
  workerType: string;
  numberOfWorkers: string;
  args?: string;
}

function RunJob({ job }: { job: Job }) {
  const { Name: jobName, NumberOfWorkers: numberOfWorkers, WorkerType: workerType } = job;

  const { handleSubmit, itemProps } = useForm<RunJobFormValues>({
    onSubmit(values) {
      submit(jobName!, values);
      showToast({
        style: Toast.Style.Success,
        title: "Job Started",
        message: `started ${jobName}`,
      });
    },
    initialValues: {
      workerType: workerType || "G.1X",
      numberOfWorkers: numberOfWorkers?.toString() || "10",
    },
    validation: {
      numberOfWorkers: (value) => {
        if (!value || Number(value) <= 0) {
          return "Number of workers must be a positive number.";
        }
      },
      workerType: (value) => {
        if (!Object.values(WorkerType).includes(value as WorkerType)) {
          return `Worker type must be one of ${Object.values(WorkerType).join(", ")}`;
        }
      },
      args: (value) => {
        if (value) {
          const lines = value.split("\n");
          const args = lines.map((line) => line.split(" ")[0]);
          const dashes = args.filter((arg) => !arg.startsWith("--"));
          if (dashes.length) {
            return `Arguments must start with --, found: ${dashes.join(", ")}`;
          }
        }
      },
    },
  });

  return (
    <Form
      navigationTitle={`Run ${jobName}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Job" onSubmit={handleSubmit} />
          <Action.OpenInBrowser
            title="Open in Console"
            url={`https://us-east-1.console.aws.amazon.com/gluestudio/home?region=us-east-1#/editor/job/${job.Name}/runs`}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea placeholder={ARGS} title="Additional Arguments" {...itemProps.args} />
      <Form.TextField title="Number of Workers" {...itemProps.numberOfWorkers} />
      <Form.Dropdown title="Worker Type" {...itemProps.workerType}>
        {Object.values(WorkerType).map((wt) => (
          <Form.Dropdown.Item key={wt} title={wt} value={wt} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

async function fetchJobs() {
  const client = new GlueClient({});
  const { Jobs } = await client.send(new GetJobsCommand({}));
  return Jobs;
}

async function submit(jobName: string, values: RunJobFormValues) {
  const argsObject: Record<string, string> = {};
  if (values.args) {
    const lines = values.args.split("\n");
    lines.forEach((line) => {
      const [key, value] = line.split(" ");
      argsObject[key] = value;
    });
  }

  await startJob({
    jobName,
    workerType: values.workerType as WorkerType,
    numberOfWorkers: Number(values.numberOfWorkers),
    args: argsObject,
  });
}

async function startJob({
  jobName,
  workerType,
  numberOfWorkers,
  args,
}: {
  jobName: string;
  workerType: WorkerType;
  numberOfWorkers: number;
  args: Record<string, string>;
}) {
  const client = new GlueClient({});
  await client.send(
    new StartJobRunCommand({
      JobName: jobName,
      NumberOfWorkers: numberOfWorkers,
      WorkerType: workerType,
      Arguments: args,
    }),
  );
}
