import Loader from "../../Global/Loader";

export default function AuthLoader({ label = "Preparing authentication" }) {
    return <Loader label={label} fullscreen />;
}
