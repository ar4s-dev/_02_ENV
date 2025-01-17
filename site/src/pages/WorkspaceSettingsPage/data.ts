import { useMutation, useQuery } from "@tanstack/react-query"
import {
  getWorkspaceBuildParameters,
  getTemplateVersionRichParameters,
  patchWorkspace,
  postWorkspaceBuild,
} from "api/api"
import { Workspace, WorkspaceBuildParameter } from "api/typesGenerated"

const getWorkspaceSettings = async (workspace: Workspace) => {
  const latestBuild = workspace.latest_build
  const [templateVersionRichParameters, buildParameters] = await Promise.all([
    getTemplateVersionRichParameters(latestBuild.template_version_id),
    getWorkspaceBuildParameters(latestBuild.id),
  ])
  return {
    workspace,
    templateVersionRichParameters,
    buildParameters,
  }
}

export const useWorkspaceSettings = (workspace: Workspace) => {
  return useQuery({
    queryKey: ["workspaceSettings", workspace.id],
    queryFn: () => getWorkspaceSettings(workspace),
  })
}

export type WorkspaceSettings = Awaited<ReturnType<typeof getWorkspaceSettings>>

export type WorkspaceSettingsFormValue = {
  name: string
  rich_parameter_values: WorkspaceBuildParameter[]
}

const updateWorkspaceSettings = async (
  workspaceId: string,
  formValues: WorkspaceSettingsFormValue,
) => {
  await Promise.all([
    patchWorkspace(workspaceId, { name: formValues.name }),
    postWorkspaceBuild(workspaceId, {
      transition: "start",
      rich_parameter_values: formValues.rich_parameter_values,
    }),
  ])

  return formValues // So we can get then on the onSuccess callback
}

export const useUpdateWorkspaceSettings = (
  workspaceId?: string,
  options?: {
    onSuccess?: (
      result: Awaited<ReturnType<typeof updateWorkspaceSettings>>,
    ) => void
    onError?: (error: unknown) => void
  },
) => {
  return useMutation({
    mutationFn: (formValues: WorkspaceSettingsFormValue) => {
      if (!workspaceId) {
        throw new Error("No workspace id")
      }
      return updateWorkspaceSettings(workspaceId, formValues)
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
