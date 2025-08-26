import {
  Step,
  StepConnector,
  stepConnectorClasses,
  StepLabel,
  Stepper,
  styled,
} from "@mui/material";
import {
  Settings,
  RemoveRedEye,
  DriveFileRenameOutline,
  Sensors,
  Thermostat,
  Battery0Bar,
  ElectricalServices,
  Storage,
} from "@mui/icons-material";
import { StepIconProps } from "@mui/material/StepIcon";
import { PURPLE_GRADIENT } from "@/styles/colors";

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: PURPLE_GRADIENT,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: PURPLE_GRADIENT,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 2,
    border: 0,
    backgroundColor: "#eaeaf0",
    borderRadius: 1,
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
}));

const ColorlibStepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme }) => ({
  backgroundColor: "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 48,
  height: 48,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  ...theme.applyStyles("dark", {
    backgroundColor: theme.palette.grey[700],
  }),
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundImage: PURPLE_GRADIENT,
        boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)",
      },
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundImage: PURPLE_GRADIENT,
      },
    },
  ],
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement<unknown> } = {
    1: <DriveFileRenameOutline sx={{ fontSize: "28px" }} />,
    2: <Sensors sx={{ fontSize: "28px" }} />,
    3: <Thermostat sx={{ fontSize: "28px" }} />,
    4: <Battery0Bar sx={{ fontSize: "28px" }} />,
    5: <ElectricalServices sx={{ fontSize: "28px" }} />,
    6: <Storage sx={{ fontSize: "28px" }} />,
    7: <Settings sx={{ fontSize: "28px" }} />,
    // 8: <RemoveRedEye sx={{ fontSize: "28px" }} />,
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = [
  "Name",
  "Sensors",
  "Threshold",
  "Battery",
  "Connectivity",
  "Not Reading",
  "Settings",
  // "Confirmation",
];

export default function AddAlarmProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <Stepper
      alternativeLabel
      activeStep={currentStep}
      connector={<ColorlibConnector />}
    >
      {steps.map((label, index) => (
        <Step key={label + index}>
          <StepLabel
            StepIconComponent={ColorlibStepIcon}
            sx={{
              "& .MuiStepLabel-label": {
                fontSize: "16px",
                fontWeight: 400,
                marginTop: "12px",
                marginBottom: "4px",
                textAlign: "center",
                lineHeight: 1.2,
              },
            }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
